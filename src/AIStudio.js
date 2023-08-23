import { Client } from "@vonage/server-client";

export class AIStudio extends Client {
    constructor(apiKey, agentId, region) {
        super({
            baseUrl: 'https://studio-api-us.ai.vonage.com'
        });
        this.apiKey = apiKey;
        this.agentId = agentId;
        
        if (region == 'us') {
            this.baseUrl = 'https://studio-api-us.ai.vonage.com';
        } else {
            this.baseUrl = 'https://studio-api-eu.ai.vonage.com';
        }
    }

    async addAuthenticationToRequest(request) {
        if (request.data.sessionToken) {
            request.headers = Object.assign({}, request.headers, {
                Authorization: `Bearer ${request.data.sessionToken}`
            });
            delete request.data.sessionToken;
            if (request.data == {}) {
                delete request.data;
            }
        } else {
            request.headers = Object.assign({}, request.headers, {
                'X-Vgai-Key': this.apiKey
            });
        }
        return request;
    }

    async startConversation() {
        const resp = await this.sendPostRequest(`${this.baseUrl}/http/init`, {agent_id: this.agentId});
        return resp.data;
    }

    async stepConversation(sessionId, sessionToken, input) {
        const data = {
            sessionToken,
            input: input || ''
        }

        const resp = await this.sendPostRequest(`${this.baseUrl}/http/${sessionId}/step`, data);
        return resp.data;
    }
}