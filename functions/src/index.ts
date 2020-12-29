const fetch = require('node-fetch');
import * as admin from 'firebase-admin';
admin.initializeApp();
global.Headers = global.Headers || fetch.Headers;

export * from './modules/getRecentReleasesHourly'
export * from './modules/searchArtist'
export * from './modules/test'
export * from './modules/cleanAlbums'
// @ts-ignore