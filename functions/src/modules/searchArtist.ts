import * as functions from 'firebase-functions';
import {getToken} from '../utils/getToken';
import {retryFetch} from '../utils/retryFetch';

export const searchArtist = functions.https.onRequest(async (request, response) => {
    const token = await getToken(
        functions.config().spotify.id,
        functions.config().spotify.secret
    )
    const query = `https://api.spotify.com/v1/search?q=${request.body.query}&limit=5&type=artist`;

    const headers = {"Authorization":`Bearer ${token}`};

    const artists = await retryFetch(query, {headers})

    response.set('Access-Control-Allow-Origin', 'https://random-scraper.web.app');
    response.set('Access-Control-Allow-Headers', 'Content-Type,Accept');
    response.send(artists);
})