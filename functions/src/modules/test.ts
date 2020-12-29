import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const db = admin.firestore();
import { getArtistsAlbums } from '../utils/getArtistsAlbums';
import {getToken} from '../utils/getToken';

export const test = functions.https.onRequest(async (request, response) => {
    const token = await getToken(
        functions.config().spotify.id,
        functions.config().spotify.secret
    )

    const snapshot = await db.collection('artists').get()
    const docs = snapshot.docs.map((doc: any) => doc.data());
        
    const res = await Promise.all(docs.map((artist: any) => getArtistsAlbums(artist.id, token)))

    res
    .flat()
    .map((album: any) => ({
        album_type:album.album_type,
        album_group: album.album_group,
        images:album.images,
        name:album.name,
        url:album.external_urls.spotify,
        id: album.id,
        artists:album.artists,
        artist_id:album.artist_id,
        release_date:album.release_date,
        release_date_ms:new Date(album.release_date).valueOf()
    }))
    .filter((album: any) => {
        if(Date.now() - album.release_date_ms < 1000 * 60 * 60 * 24 * 30 
            && album.album_type !== "compilation" 
            && album.artists[0].name !== "Various Artists"
        ){
            return album
        }
    })
    .sort((a: any,b: any) => {
        return b.release_date_ms - a.release_date_ms
    })
    .forEach(album => {
        db.collection("albums").doc(album.id).set(album)
    })
})