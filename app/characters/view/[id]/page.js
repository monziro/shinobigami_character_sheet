"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function CharacterViewPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      const docRef = doc(db, "characters", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCharacter(docSnap.data());
      }
    };
    fetchCharacter();
  }, [id]);

  if (!character) {
    return <p>キャラクターを読み込み中...</p>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>キャラクター閲覧</h2>
      <p>キャラクター名: <strong>{character.name}</strong></p>
      <p>HP: {character.stats?.HP}</p>
      <p>MP: {character.stats?.MP}</p>
      {character.imageUrl && (
        <img
          src={character.imageUrl}
          alt={character.name}
          style={{ width: "100%", height: "auto", marginTop: "20px" }}
        />
      )}
      <p>所有者ID: <strong>{character.ownerId}</strong></p>
    </div>
  );
}
