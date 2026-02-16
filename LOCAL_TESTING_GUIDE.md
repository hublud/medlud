# Local Testing & Tunnelling Guide

Testing telemedicine calls on `localhost` can be challenging due to browser security policies and hardware constraints. Use this guide to test effectively.

## 1. Local Browser Testing
You can test the flow on a single machine by using two different browser instances:
- **Instance A (Doctor)**: Your normal browser (Logged in as Staff).
- **Instance B (Patient)**: An **Incognito/Private** window or a different browser like Firefox (Logged in as Patient).

> [!TIP]
> Use headphones to avoid the "Infinite Echo" when both sides of the call are in the same room.

## 2. Bypassing Camera/Mic Restrictions
Browsers usually require **HTTPS** to access the camera. While `localhost` is considered a "Secure Context," accessing your local IP (e.g., `192.168.1.5:3000`) from a mobile phone will often block the camera.

### Chrome Workaround
If you are testing on your phone via local IP and the camera is blocked:
1. Open Chrome on the phone.
2. Go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
3. Add your local IP and port (e.g., `http://192.168.1.5:3000`).
4. Relaunch Chrome.

## 3. Recommended: Tunnelling (ngrok)
To test on real mobile devices or different networks with full HTTPS support, we recommend **ngrok**.

### Setup Steps:
1. **Install**: Download from [ngrok.com](https://ngrok.com).
2. **Expose**: Run the following in your terminal:
   ```bash
   ngrok http 3000
   ```
3. **Use**: ngrok will give you a public URL like `https://xyz.ngrok-free.app`.
4. **Update Supabase**: Ensure your **Redirect URLs** in Supabase Auth settings include this temp URL if you plan to test the login flow.

## 4. Verification Checklist
- [ ] **Camera/Mic Prompt**: Does the browser ask for permission?
- [ ] **Connection**: Does the "Last Sync" timestamp on the doctor's sidebar update?
- [ ] **Incoming Alert**: Does the doctor hear the ping and see the modal?
- [ ] **Two-Way Audio**: Can both sides hear each other?
