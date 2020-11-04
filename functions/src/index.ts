import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
const fetch = require('node-fetch');
const db = admin.firestore();

// @ts-ignore
global.Headers = global.Headers || fetch.Headers;

const credencials = {
    clientId: '9f5ff044a2d24057881289d7617bcd6b',
    clientSecret: 'aa4f6d0fa5d241e68e5a999c33638f34'
}

const appendArtist = (albums: any, artist_id: string) => {
    return albums.items.map((album: any) => ({...album, artist_id}));
}

const getToken = async () => {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", `Basic ${Buffer.from(credencials.clientId + ':' + credencials.clientSecret).toString('base64')}`);
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    var urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    }
    
    // @ts-ignore
    let res = await fetch("https://accounts.spotify.com/api/token", requestOptions);
    res = await res.json();
    // @ts-ignore
    return res.access_token; 
}

const getAlbum = async(artistId: string, token: string) => {
    const headers = new Headers();
    headers.append("Authorization",`Bearer ${token}`)

    const albums = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=3&include_groups=album`, {headers}).then((res: any) => res.json()).then((albums: any) => appendArtist(albums, artistId))
    const singles = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=3&include_groups=single`, {headers}).then((res: any) => res.json()).then((albums: any) => appendArtist(albums, artistId))
    const feats = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=5&include_groups=appears_on`, {headers}).then((res: any) => res.json()).then((albums: any) => appendArtist(albums, artistId))

    return {albums, singles, feats}
}


export const houerlyJob = functions.pubsub
.schedule('0 * * * *')
.onRun(async (context: any) => {
    const token = await getToken()
    
    const snapshot = await db.collection('artists').get()
    const docs = snapshot.docs.map(doc => doc.data());
        
    const res = await Promise.all(docs.map((artist) => getAlbum(artist.id, token)))
    
    const albums = res
        .map((artist: any) => ([
            ...artist.albums,
            ...artist.singles,
            ...artist.feats
        ]))
        .flat()
        .map((album: any) => ({
            album_type:album.album_type,
            album_group: album.album_group,
            images:album.images,
            name:album.name,
            url:album.external_urls.spotify,
            artists:album.artists,
            artist_id:album.artist_id,
            release_date:album.release_date,
            release_date_ms:new Date(album.release_date).valueOf()
        }))
        .filter((album: any) => {
            if(Date.now() - album.release_date_ms < 1000 * 60 * 60 * 24 * 30 && album.album_type !== "compilation"){
                return album
            }
        })
        .sort((a: any,b: any) => {
            return b.release_date_ms - a.release_date_ms
        })
        
    await db.collection("scrapes").doc('scrapes').set({value: JSON.stringify(albums)}).then(() => {
        functions.logger.info("Scrapes set status: succes", {structuredData: true});
    });
})

export const getArtists = functions.firestore.document('/artists/{artistId}').onWrite(async () => {
    const token = await getToken();

    const snapshot = await db.collection('artists').get()
    const dbArtists = snapshot.docs.map(doc => doc.data());
    const query = dbArtists.reduce((p: any,q: any) => {
        return [...p,q.id]
    }, []).join(',')

    const headers = new Headers();
    headers.append("Authorization",`Bearer ${token}`)


    const result = await fetch(`https://api.spotify.com/v1/artists?ids=${query}`, {headers}).then((res: any) => res.json())
    const artists = result.artists.map((artist: any) => ({
        url: artist.external_urls.sporify,
        followers: artist.followers.total,
        id: artist.id,
        images: artist.images,
        name: artist.name
    }))

    await db.collection("scrapes").doc('artists').set({value: JSON.stringify(artists)}).then(() => {
        functions.logger.info("Artist set status: succes", {structuredData: true});
    });
});


export const searchArtist = functions.https.onRequest(async (request, response) => {
    const token = await getToken();
    const query = request.body.query;

    const headers = new Headers();
    headers.append("Authorization",`Bearer ${token}`)

    const artists = await fetch(`https://api.spotify.com/v1/search?q=${query}&limit=5&type=artist`, {headers}).then((res: any) => res.json())

    response.send(artists);
})