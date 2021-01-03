import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const db = admin.firestore();
import { getToken } from '../utils/getToken';
import { getArtistsAlbums } from '../utils/getArtistsAlbums';

export const getRecentReleasesHourly = functions.pubsub
    .schedule('0 * * * *')
    .onRun(async () => {
        const token = await getToken(
            functions.config().spotify.id,
            functions.config().spotify.secret
        )
    
        const snapshot = await db.collection('followed').get()
        const docs = snapshot.docs.map((doc: any) => doc.id);
            
        const res = await Promise.all(docs.map((id: any) => getArtistsAlbums(id, token)))
    
        await res
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

        functions.logger.info("Albums set status: succes", {structuredData: true});
    })