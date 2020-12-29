import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const db = admin.firestore();

export const cleanAlbums = functions.pubsub
    .schedule('58 3 * * *')
    .onRun(async () => {
        const snapshot = await db.collection('albums').get()
        const docsIds = snapshot.docs.map(doc => doc.id);

        await Promise.all(docsIds.map((id: any) => (db.collection('albums').doc(id).delete())));
    })