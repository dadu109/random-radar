import fetch from 'node-fetch'
import {retryFetch} from './retryFetch';

// @ts-ignore
global.Headers = global.Headers || fetch.Headers;

export const getArtistsAlbums = async(artistId: string, token: string) => {
    const headers = {"Authorization":`Bearer ${token}`};
    const query = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=6&include_groups=`;
    const includeGroups = ["album","single"]

    const albums = (await Promise.all(includeGroups
        .map(group => retryFetch((query+group),{headers},5))))
        .map(album => album.items.map((album: any) => ({...album, artist_id: artistId})))
        .flat()

    return albums;
}