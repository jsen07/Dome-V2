import { useEffect, useState } from "react";
import { getDatabase, ref, child, get } from "firebase/database";

export function useLikesPreloader(posts) {
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [profileDataMap, setProfileDataMap] = useState({}); // { postId: [profiles] }

  useEffect(() => {
    if (!posts || posts.length === 0) {
      setProfilesLoaded(true);
      return;
    }

    let isCancelled = false;
    setProfilesLoaded(false);

    const dbRef = ref(getDatabase());

    const promises = posts.map(async (post) => {
      if (!post.likes || post.likes.length === 0) return [];
      const snapshots = await Promise.all(
        post.likes.map((uid) => get(child(dbRef, `users/${uid}`)))
      );
      return snapshots
        .filter((snap) => snap.exists())
        .map((snap) => {
          const user = snap.val();
          return {
            displayName: user.displayName,
            photoUrl: user.photoUrl || "",
            uid: user.uid,
          };
        });
    });

    Promise.all(promises).then((allProfiles) => {
      if (!isCancelled) {
        const map = {};
        posts.forEach((post, i) => {
          map[post.postKey] = allProfiles[i];
        });
        setProfileDataMap(map);
        setProfilesLoaded(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [posts.length]);

  return { profilesLoaded, profileDataMap };
}
