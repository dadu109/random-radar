import fetch from 'node-fetch'

export const getToken = async (id: string, secret: string) => {
    const myHeaders = new Headers();
    const urlencoded = new URLSearchParams();

    myHeaders.append("Authorization", `Basic ${Buffer.from(id + ':' + secret).toString('base64')}`);
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    urlencoded.append("grant_type", "client_credentials");

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    }

    // @ts-ignore
    const res = await fetch("https://accounts.spotify.com/api/token", requestOptions).then(res => res.json());
    return res.access_token;
}