let userList = [];

function inviteToMeeting(userId) {
    const meetingId = document.getElementById('videos').dataset.meetingid;
    fetch(`/api/meetings/${meetingId}/users`, {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(res => res.json())
        .then(data => {
            const currentUsers = document.getElementById('current-users');
            currentUsers.innerHTML = '';
            for (user of data._embedded.users) {
                const el = document.createElement('div');
                el.innerText = user.username;
                currentUsers.appendChild(el);
            }
            document.getElementById('user-search-list').classList.add('hidden');
        })
}

function updateUserListDisplay(query) {
    const container = document.getElementById('user-search-list');
    container.innerHTML = '';
    for (user of userList) {
        if (query && !user.toLowerCase().includes(query.toLowerCase())) {
            continue;
        }
        const el = document.createElement('div');
        el.classList.add('username');
        el.innerText = user.username;
        el.dataset.userid = user.id
        container.appendChild(el);
    }
    container.classList.remove('hidden');
}

document.getElementById('name-search').addEventListener('focus', (e) => {
    fetch('/api/users')
        .then(res => res.json())
        .then(data => {
            userList = data._embedded.users;
            updateUserListDisplay();
        })
});

document.getElementById('name-search').addEventListener('input', (e) => {
    updateUserListDisplay(document.getElementById('name-search').value);
});

document.getElementById('user-search-list').addEventListener('click', (e) => {
    const target = e.target.closest('.username');
    if (target) {
        inviteToMeeting(target.dataset.userid, 5);
        return;
    }
});
