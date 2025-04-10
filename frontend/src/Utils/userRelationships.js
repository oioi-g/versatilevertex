import { doc, setDoc, deleteDoc, getDoc, serverTimestamp, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";

async function followUser(currentUserId, targetUserId) {
  const relationshipRef = doc(db, "user", currentUserId, "relationships", targetUserId);

  await setDoc(relationshipRef, {
    type: "follow",
    targetUserId: targetUserId,
    createdAt: new Date(),
  });
};

async function unfollowUser(currentUserId, targetUserId) {
  const relationshipRef = doc(db, "user", currentUserId, "relationships", targetUserId);
  await deleteDoc(relationshipRef);
};

async function blockUser(currentUserId, targetUserId) {
  if (!currentUserId || !targetUserId) {
    console.error("Invalid user IDs provided");
    return false;
  }

  try {
    const relationshipRef = doc(db, `user/${currentUserId}/relationships/${targetUserId}`);

    await setDoc(relationshipRef, {
      targetUserId: targetUserId,
      type: "block",
      createdAt: serverTimestamp(),
    });

    console.log(`User ${targetUserId} blocked successfully.`);
    return true;

  } catch (error) {
    console.error("Error blocking user:", error);
    return false;
  }
}

// Function to unblock a user
async function unblockUser(currentUserId, targetUserId) {
  if (!currentUserId || !targetUserId) {
    console.error("Invalid user IDs provided");
    return false;
  }

  try {
    const relationshipRef = doc(db, `user/${currentUserId}/relationships/${targetUserId}`);

    const docSnap = await getDoc(relationshipRef);
    if (!docSnap.exists()) {
      console.warn("User was not blocked.");
      return false;
    }

    await deleteDoc(relationshipRef);
    console.log(`User ${targetUserId} unblocked successfully.`);
    return true;

  } catch (error) {
    console.error("Error unblocking user:", error);
    return false;
  }
}

async function getVisibleCollages(currentUserId) {
  const collagesRef = collection(db, "publicCollages");
  const userRelationshipsRef = collection(db, `user/${currentUserId}/relationships`);

  // Fetch all relationships for the current user
  const blockedUsersSnapshot = await getDocs(userRelationshipsRef);

  // Filter only blocked users
  const blockedUserIds = blockedUsersSnapshot.docs
    .filter((doc) => doc.data().type === "block")
    .map((doc) => doc.id);

  // If user hasn't blocked anyone, return all public collages
  if (blockedUserIds.length === 0) {
    const allCollagesSnapshot = await getDocs(collagesRef);
    return allCollagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Firestore "not-in" only supports up to 10 elements
  if (blockedUserIds.length > 10) {
    const allCollagesSnapshot = await getDocs(collagesRef);
    return allCollagesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((collage) => !blockedUserIds.includes(collage.postedBy));
  }

  // If 10 or fewer blocked users, use "not-in" query
  const collagesQuery = query(collagesRef, where("postedBy", "not-in", blockedUserIds));
  const collagesSnapshot = await getDocs(collagesQuery);

  return collagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export { followUser, unfollowUser, blockUser, unblockUser, getVisibleCollages };