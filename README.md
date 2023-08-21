# Vonage Video and CPaaS Integration Demo

<img src="https://developer.nexmo.com/images/logos/vbc-logo.svg" height="48px" alt="Vonage" />

This sample application shows a few different ways that the Vonage Video platform can be integrated with other Vonage CPaas APIs, such as Verify and Messages.

## Installation

### Requirements

* A Vonage Account with Video Capability ([Sign up here](https://ui.idp.vonage.com/ui/auth/registration?icid=tryitfree_api-developer-adp_nexmodashbdfreetrialsignup_nav))
* Node.js 16+
* A tunneling service such as [ngrok](https://developer.vonage.com/en/getting-started/tools/ngrok) or a hosting service like Railway.
* A Vonage Application configured for Video and Messaging

### Set Up

#### Local Installation

* Clone this repository to your computer
* Copy `.env.dist` to `.env`
* Fill in the following information into the new `.env` file. You need either `PRIVATE_KEY` or `PRIVATE_KEY64`, but not both:
  * `API_KEY` - Your Vonage API Key from your customer dashboard.
  * `API_SECRET` - Your Vonage API Secret from your customer dashboard.
  * `VONAGE_VERIFY_BRAND` - The name you want to appear in the Verify messages.
  * `API_APPLICATION_ID` - The Application ID you have set up in your customer dashboard.
  * `PRIVATE_KEY` - Path to where the Application Private Key is located on your computer.
  * `PRIVATE_KEY64` - A base64-encoded version of the Application Private Key. [See this article for more info](https://developer.vonage.com/en/blog/using-private-keys-in-environment-variables).
  * `VONAGE_FROM_NUMBER` - A number linked to the Application to be used with the Messages API.

## Running the Demo

* Start the server with `npm run dev`
* Start your tunneling service on port 3000. For example, `ngrok http 3000`
* Visit the URL assigned by your tunneling service
* Log in with the username `root` and the password `root`

## What does this demo show?

### Multi-room and Multi-party Video Meetings

This demo allows different users to create their own meeting rooms, and invite other users to join them. Owners of a meeting can select users of the system to add them to the room, and only invited users can join the rooms. When a user logs in, they see a list of meetings that they have been added to.

We use the [Vonage Video Web SDK](https://developer.vonage.com/en/video/client-sdks/web?source=video) to provide a web interface for users to have the video meeting itself. The [Vonage Node.js SDK](https://developer.vonage.com/en/video/server-sdks/node?source=video) is used to handle creating the sessions and token generation for the developer.

```js
// src/meetings.js
router.all('/meetings/create', protectRoute('*'), async (req, res) => {
    const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });

    if (req.method === 'POST') {
        const { meeting_name } = req.body;
        const session = await video.createSession();
        const resp = db.prepare('INSERT INTO rooms (room_name, owner_id, session_id) VALUES (?, ?, ?)').run(meeting_name, req.session.user.id, session.sessionId);
        db.prepare('INSERT INTO room_users (room_id, user_id) VALUES (?,?)').run(resp.lastInsertRowid, req.session.user.id);

        res.flash('success', 'Created new room');
        res.redirect('/');
        return;
    }

    res.render('meetings/create.twig', { randomName });
});

router.get('/meetings/:id', protectRoute('*'), async (req, res) => {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
    const currentUsers = db.prepare('SELECT users.id, users.username FROM room_users JOIN users ON users.id=room_users.user_id WHERE room_users.room_id = ?').all(req.params.id);

    if (currentUsers.filter(user => user.id === req.session.user.id).length === 0) {
        res.flash('error', 'Unable to find meeting');
        res.redirect('/');
        return;
    }

    const role = room.owner_id === req.session.user.id ? 'moderator' : 'publisher'

    res.render('meetings/view.twig', {
        applicationId: process.env.API_APPLICATION_ID,
        sessionId: room.session_id,
        token: video.generateClientToken(room.session_id, { role }),
        role,
        currentUsers,
        meetingId: req.params.id,
    });
});
```

### Vonage Verify API

If a user has configured a telephone number, we will use it as a second authentication factor for logging in the user. Once a user has supplied their password, an SMS (and failing that, a telephone call and then a potential second SMS) will be sent to the user with a PIN. The user must enter that PIN to finish logging in.

This uses the [Verify API](https://developer.vonage.com/en/verify/verify-v1/overview?source=verify) to send the PIN to the user, making it easy to add multi-factor authentication to an application.

```js
// src/login.js
router.all('/login', async (req, res) => {
    if (req.method === "POST") {
        const { username, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (user) {
            const verified = await bcrypt.compare(password, user.password);
            if (verified) {
                req.session.user = user;

                if (user.phone_number) {
                    const response = await vonage.verify.start({
                        number: user.phone_number,
                        brand: process.env.VONAGE_VERIFY_BRAND,
                    });
                    req.session.mfa = false;
                    req.session.request_id = response.requestId;
                    req.session.save();
                    res.redirect('/login/verify');
                    return;
                } else {
                    req.session.mfa = true;
                    req.session.save();
                    res.redirect(req.session.return_url || '/');
                    return;
                }
            } else {
                res.flash('error', 'Unable to verify username or password');
            }
        } else {
            res.flash('error', 'Unable to verify username or password');
        }
    }
    res.render('login.twig');
});

router.all('/login/verify', async (req, res) => {
    if (req.method === 'POST') {
        const { pin } = req.body;
        const response = await vonage.verify.check(req.session.request_id, pin);
        if (response.status === '0') {
            delete req.session.request_id;
            req.session.authenticated = true;
            req.session.mfa = true;

            res.redirect(req.session.return_url || '/');
            return;
        } else {
            res.flash('error', 'Unable to verify PIN');
        }
    }
    res.render('verify.twig');
})
```

### Vonage Messages API

If a user has configured a phone number and enabled SMS notification, the system will send them an SMS when they are added to a meeting. This way a user gets an immediate notification that they have been invited to the meeting. They can then log in and join the meeting.

This uses the [Messages API](https://developer.vonage.com/en/messages/overview) to send the SMS message. This could be expanded to work with any of our channels, but we use SMS as an example.

```js
// src/api/meetings.js
router.post('/api/meetings/:id/users', protectRoute('*'), async (req, res) => {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
    if (room.owner_id !== req.session.user.id) {
        res.status(404).send({
            title: 'Unable to find requested meeting'
        });
        return;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.body.user_id);
    try {
        db.prepare('INSERT INTO room_users (room_id, user_id) VALUES (?, ?)').run(req.params.id, req.body.user_id);
        if (user.notify_sms && user.phone_number) {
            vonage.messages.send(new SMS(
                `You have been invited to a new meeting: ${room.room_name}`,
                user.phone_number,
                process.env.VONAGE_FROM_NUMBER
            ));
        }
    } catch (e) {
        // Ignore for now
    }
    
    const users = db.prepare('SELECT users.id, users.username FROM room_users JOIN users ON users.id=room_users.user_id WHERE room_users.room_id = ?').all(req.params.id);

    res.send({
        count: users.length,
        total: users.length,
        _embedded: {
            users: users
        },
        _links: {
            self: {
                href: req.originalUrl
            }
        }
    })
});
```