import axios from 'axios';
import { db, collection, addDoc, serverTimestamp, getDocs, query, where } from './firebase';

const populateFirestore = async () => {
  const API_KEY = "AIzaSyCYf-xflkPk9u8tk2Dj104LCSQZfGLSc_0";
  try {
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        client_id: API_KEY,
        query: "aesthetic",
        per_page: 30,
      },
    });
    const images = response.data.results;
    for (const image of images) {
      const { urls, alt_description } = image;
      const imageRef = collection(db, 'unsplashImages');
      const q = query(imageRef, where("imageUrl", "==", urls.regular));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        try {
          await addDoc(collection(db, 'unsplashImages'), {
            imageUrl: urls.regular,
            description: alt_description,
            createdAt: serverTimestamp(),
            likes: 0,
          });
          console.log(`Image ${urls.regular} added to Firestore`);
        }
        catch (error) {
          console.error(`Error adding image ${urls.regular} to Firestore:`, error);
        }
      }
      else {
        console.log(`Image ${urls.regular} already exists in Firestore. Skipping.`);
      }
    }
    console.log('Firestore population complete!');
  }
  catch (error) {
    console.error(error);
  }
};

export default populateFirestore;