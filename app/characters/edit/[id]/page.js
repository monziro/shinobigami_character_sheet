"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db, storage } from "../../../../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  regulations,
  upperSchools,
  lowerSchools,
  styles,
  ougiNames,
} from "../../../../data/characterOptions";
import skillsData from "../../../../data/skills.json";
import ninpoCommon from "../../../../data/ninpo-common.json";
import ninpoOtg from "../../../../data/ninpo-otg.json";
import ougiAlteration from "../../../../data/ougi-alteration.json";


export default function CharacterEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);

  // 基本項目
  const [name, setName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [rank, setRank] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [nemesis, setNemesis] = useState("");
  const [regulation, setRegulation] = useState("");
  const [upperSchool, setUpperSchool] = useState("");
  const [lowerSchool, setLowerSchool] = useState("");
  const [style, setStyle] = useState("");
  const [publicFace, setPublicFace] = useState("");
  const [belief, setBelief] = useState("");
  const [achievement, setAchievement] = useState("");
  const [background, setBackground] = useState("");
  const [memo, setMemo] = useState("");

  // 基本項目共通スタイル
  const inputStyle = {
    width: "100%",
    border: "1px solid #aaa",
    borderRadius: "4px",
    padding: "4px 6px",
    fontSize: "0.9em"
  };

  // 特技リスト用 state
  const [skillCategory, setSkillCategory] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  // チェックボックスの更新処理
  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  // ブランク列の選択状態を管理
  const [selectedBlankColumns, setSelectedBlankColumns] = useState([]);
  // クリックしたブランク列を選択／解除
  const handleBlankColumnToggle = (idx) => {
    if (selectedBlankColumns.includes(idx)) {
      setSelectedBlankColumns(selectedBlankColumns.filter((i) => i !== idx));
    } else {
      setSelectedBlankColumns([...selectedBlankColumns, idx]);
    }
  };
  // すべての特技を統合
  const allSkills = Object.entries(skillsData.skills).flatMap(([category, skills]) =>
    skills.map((name) => ({
      name,          // 特技名
      category       // カテゴリ（器術、体術、忍術など）
    }))
  );

  // 奥義
  const [ougiName, setOugiName] = useState("");
  const [ougiSkillCategory, setOugiSkillCategory] = useState("");
  const [ougiSkill, setOugiSkill] = useState("");
  const [ougiEffect, setOugiEffect] = useState("");
  const [ougiType, setOugiType] = useState("");
  const [ougiStrength, setOugiStrength] = useState("");
  const [ougiWeakness, setOugiWeakness] = useState("");
  const [ougiAlterations, setOugiAlterations] = useState([
    { strength: "", weakness: "" }
  ]);
  const addAlterationSet = () => {
    setOugiAlterations([...ougiAlterations, { strength: "", weakness: "" }]);
  };
  const removeAlterationSet = (index) => {
    setOugiAlterations(ougiAlterations.filter((_, i) => i !== index));
  };
  const updateAlteration = (index, field, value) => {
    const newList = [...ougiAlterations];
    newList[index][field] = value;
    setOugiAlterations(newList);
  };


  // 忍具
  const [hyourogan, setHyourogan] = useState("");
  const [jintsugan, setJintsugan] = useState("");
  const [tonkofu, setTonkofu] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState("");

  // 忍法
  const [selectedFaction, setSelectedFaction] = useState("");
  const [selectedSubFaction, setSelectedSubFaction] = useState("");
  const [ninpoSearch, setNinpoSearch] = useState("");
  const [ninpoTypeFilter, setNinpoTypeFilter] = useState("");
  const [ninpoTagFilters, setNinpoTagFilters] = useState([]);
  const [ninpoRangeFilter, setNinpoRangeFilter] = useState("");
  const [ninpoCostFilter, setNinpoCostFilter] = useState("");
  const [ninpoRankFilter, setNinpoRankFilter] = useState("");
  const [selectedNinpo, setSelectedNinpo] = useState([]);
  // チェックボックス更新処理
  const handleNinpoToggle = (ninpoName) => {
    if (selectedNinpo.includes(ninpoName)) {
      setSelectedNinpo(selectedNinpo.filter((n) => n !== ninpoName));
    } else {
      setSelectedNinpo([...selectedNinpo, ninpoName]);
    }
  };
  const handleTagToggle = (tag) => {
    if (ninpoTagFilters.includes(tag)) {
      setNinpoTagFilters(ninpoTagFilters.filter((t) => t !== tag));
    } else {
      setNinpoTagFilters([...ninpoTagFilters, tag]);
    }
  };

  const allNinpoData = [ninpoCommon, ninpoOtg];

  // 忍法のフィルタ初期化
  const resetNinpoFilters = () => {
    setNinpoSearch("");
    setSelectedFaction("");
    setSelectedSubFaction("");
    setNinpoTypeFilter("");
    setNinpoTagFilters([]);   // 複数タグフィルタは空配列に戻す
    setNinpoRangeFilter("");
    setNinpoCostFilter("");
    setNinpoRankFilter("");
  };

  // すべての忍法を統合
  const allNinpoList = allNinpoData.flatMap((f) =>
    Object.entries(f.subFaction).flatMap(([subFactionName, ninpos]) =>
      ninpos.map((n) => ({
        ...n,
        faction: f.faction,
        subFaction: subFactionName,
      }))
    )
  );
  // フィルタ処理
  const filteredNinpo = allNinpoList.filter((n) => {
    const searchMatch =
      n.name.includes(ninpoSearch) ||
      n.reading.includes(ninpoSearch) ||
      n.description.includes(ninpoSearch);

    const typeMatch = ninpoTypeFilter ? n.type === ninpoTypeFilter : true;
    const rangeMatch = ninpoRangeFilter ? String(n.range) === ninpoRangeFilter : true;
    const costMatch = ninpoCostFilter ? String(n.cost) === ninpoCostFilter : true;
    const rankMatch = ninpoRankFilter ? n.rank === ninpoRankFilter : true;

    const tagMatch =
      ninpoTagFilters.length > 0
        ? ninpoTagFilters.every((tag) => n.tags.includes(tag))
        : true;

    const factionMatch = selectedFaction ? n.faction === selectedFaction : true;
    const subFactionMatch = selectedSubFaction ? n.subFaction === selectedSubFaction : true;

    return (
      searchMatch &&
      typeMatch &&
      rangeMatch &&
      costMatch &&
      rankMatch &&
      tagMatch &&
      factionMatch &&
      subFactionMatch
    );
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (id) {
        const docRef = doc(db, "characters", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCharacter(data);

          // 基本項目
          setName(data.name || "");
          setFurigana(data.furigana || "");
          setRegulation(data.regulation || "");
          setUpperSchool(data.upperSchool || "");
          setLowerSchool(data.lowerSchool || "");
          setStyle(data.style || "");
          setPublicFace(data.publicFace || "");
          setBelief(data.belief || "");
          setAchievement(data.achievement || "");
          setBackground(data.background || "");
          setMemo(data.memo || "");


          setSkillCategory(data.skillCategory || "");
          setSelectedSkills(data.selectedSkills || []);

          // 奥義
          setOugiName(data.ougiName || "");
          setOugiSkill(data.ougiSkill || "");
          setOugiEffect(data.ougiEffect || "");

          // 忍具
          setHyourogan(data.hyourogan || "");
          setJintsugan(data.jintsugan || "");
          setTonkofu(data.tonkofu || "");

          // 忍法
          setSkillCategory(data.skillCategory || "");
          setSelectedSkills(data.selectedSkills || []);
          setSelectedNinpo(data.selectedNinpo || []);

          setPreviewUrl(data.imageUrl || null);
        }
      }
    });
    return () => unsubscribe();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user || user.uid !== character.ownerId) {
      setMessage("編集権限がありません");
      return;
    }
    try {
      const docRef = doc(db, "characters", id);
      let imageUrl = character.imageUrl;

      if (imageFile) {
        const imageRef = ref(storage, `characters/${user.uid}/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateDoc(docRef, {
        name,
        furigana,
        regulation,
        upperSchool,
        lowerSchool,
        style,
        publicFace,
        belief,
        achievement,
        background,
        memo,
        skillCategory,
        selectedSkills, // ← 配列で保存
        skill,
        ougiName,
        ougiSkill,
        ougiEffect,
        hyourogan,
        jintsugan,
        tonkofu,
        selectedNinpo, // ← 忍法を配列で保存
        imageUrl,
      });

      setMessage("キャラクターを更新しました！");
    } catch (error) {
      setMessage("更新エラー: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!user || user.uid !== character.ownerId) {
      setMessage("削除権限がありません");
      return;
    }
    try {
      const docRef = doc(db, "characters", id);
      await deleteDoc(docRef);
      setMessage("キャラクターを削除しました！");
      router.push("/my-characters");
    } catch (error) {
      setMessage("削除エラー: " + error.message);
    }
  };

  if (!character) {
    return <p>キャラクターを読み込み中...</p>;
  }

  return (
    <div style={{ maxWidth: "3000px", margin: "auto" }}>
      <h2>キャラクター編集</h2>
      <form onSubmit={handleUpdate}>
        {/* キャラの基本情報 */}
        <div
          style={{
            maxWidth: "900px",
            border: "2px solid #444",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#fafafa",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.1)"
          }}
        >
          <h3
            style={{
              marginBottom: "12px",
              fontSize: "1.4em",
              fontWeight: "bold",
              textAlign: "center",
              color: "#222",
              borderBottom: "2px solid #666",
              paddingBottom: "4px"
            }}
          >
            キャラの基本情報
          </h3>

          {/* 画像 + 基本情報の横並び */}
          <div style={{ display: "flex", gap: "16px" }}>

            {/* 左側：画像エリア */}
            <div style={{ width: "300px", textAlign: "center" }}>
              {/* 画像枠 */}
              <div
                style={{
                  width: "100%",
                  height: "300px",
                  border: "2px solid #aaa",
                  borderRadius: "8px",
                  backgroundColor: "#eee",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden"
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="キャラ画像"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <span style={{ color: "#666" }}>No Image</span>
                )}
              </div>

              {/* 画像変更ボタン */}
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  border: "2px solid #aaa",
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5",
                  boxShadow: "1px 1px 4px rgba(0,0,0,0.1)"
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* 右側：基本情報フォーム */}
            <div style={{ flex: 1 }}>

              {/* 名前・フリガナ */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 1fr", gap: "8px", marginBottom: "8px" }}>
                <label>名前</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="名前" style={inputStyle} />
                <label>フリガナ</label>
                <input type="text" value={furigana} onChange={(e) => setFurigana(e.target.value)} placeholder="フリガナ" style={inputStyle} />
              </div>

              {/* 階級・仇敵 */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 1fr", gap: "8px", marginBottom: "8px" }}>
                <label>階級</label>
                <input type="text" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="階級" style={inputStyle} />
                <label>仇敵</label>
                <input type="text" value={nemesis} onChange={(e) => setNemesis(e.target.value)} placeholder="仇敵" style={inputStyle} />
              </div>

              {/* 年齢・性別 */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 1fr", gap: "8px", marginBottom: "8px" }}>
                <label>年齢</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="年齢" style={inputStyle} />
                <label>性別</label>
                <input type="text" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="性別" style={inputStyle} />
              </div>

              {/* 上位流派・下位流派 */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 1fr", gap: "8px", marginBottom: "8px" }}>
                <label>上位流派</label>
                <select value={upperSchool} onChange={(e) => setUpperSchool(e.target.value)} style={inputStyle}>
                  <option value="">選択してください</option>
                  {upperSchools.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <label>下位流派</label>
                <select value={lowerSchool} onChange={(e) => setLowerSchool(e.target.value)} style={inputStyle}>
                  <option value="">選択してください</option>
                  {lowerSchools.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* 表の顔・信念 */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 1fr", gap: "8px", marginBottom: "8px" }}>
                <label>表の顔</label>
                <input type="text" value={publicFace} onChange={(e) => setPublicFace(e.target.value)} placeholder="表の顔" style={inputStyle} />
                <label>信念</label>
                <input type="text" value={belief} onChange={(e) => setBelief(e.target.value)} placeholder="信念" style={inputStyle} />
              </div>

              {/* 流儀 */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "8px", marginBottom: "8px" }}>
                <label>流儀</label>
                <input type="text" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="流儀" style={inputStyle} />
              </div>

              {/* 背景 */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "8px", marginBottom: "8px" }}>
                <label>背景</label>
                <input type="text" value={background} onChange={(e) => setBackground(e.target.value)} placeholder="背景" style={inputStyle} />
              </div>

              {/* メモ */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "8px" }}>
                <label style={{ alignSelf: "start" }}>メモ</label>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモ" rows={5} style={{
                  width: "100%",
                  border: "1px solid #aaa",
                  borderRadius: "4px",
                  padding: "6px",
                  fontSize: "0.9em"
                }} />
              </div>

            </div>
          </div>
        </div>

        {/* 特技欄 */}
        <div
          style={{
            maxWidth: "900px",
            border: "2px solid #444",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#fafafa",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.1)"
          }}
        >
          <h3
            style={{
              marginBottom: "8px",
              fontSize: "1.3em",
              fontWeight: "bold",
              textAlign: "center",
              borderBottom: "2px solid #666",
              paddingBottom: "4px"
            }}
          >
            特技
          </h3>

          {/* 特技選択グリッド */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px repeat(6, 115px 15px) 40px",
              gap: "1px",
              overflowX: "auto", // 横スクロール対応（画面幅が狭い場合）
              paddingBottom: "4px"
            }}
          >
            {/* 左端の行番号列 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: "0.9em",
                fontWeight: "bold"
              }}
            >
              <div style={{ height: "35px" }}></div>
              {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                <div key={num} style={{ height: "40px", lineHeight: "40px" }}>
                  {num}
                </div>
              ))}
            </div>

            {/* カテゴリ列 */}
            {Object.entries(skillsData.skills).map(([category, skills], idx) => (
              <React.Fragment key={category}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    backgroundColor: "#f9f9f9"
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      textAlign: "center",
                      padding: "6px",
                      backgroundColor: "#eee",
                      borderBottom: "1px solid #ccc",
                      fontSize: "0.85em"
                    }}
                  >
                    {category}
                  </div>

                  {skills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <div
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        style={{
                          height: "40px",
                          lineHeight: "40px",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#d0f0d0" : "transparent",
                          borderBottom: "1px solid #ddd",
                          fontSize: "0.75em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {skill}
                      </div>
                    );
                  })}
                </div>

                {/* ブランク列 */}
                <div
                  onClick={() => handleBlankColumnToggle(idx)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px dashed #aaa",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: selectedBlankColumns.includes(idx)
                      ? "#f0e0e0"
                      : "transparent"
                  }}
                >
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        height: "40px",
                        width: "100%",
                        textAlign: "center",
                        fontSize: "0.7em",
                        color: "#999"
                      }}
                    >
                      {/* ブランクセル */}
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}

            {/* 右端の行番号列 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: "0.9em",
                fontWeight: "bold"
              }}
            >
              <div style={{ height: "35px" }}></div>
              {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                <div key={num} style={{ height: "40px", lineHeight: "40px" }}>
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>





        {/* 奥義欄 */}
        <div
          style={{
            maxWidth: "900px",
            border: "2px solid #444",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#fafafa",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.1)"
          }}
        >
          <h3
            style={{
              marginBottom: "8px",
              fontSize: "1.3em",
              fontWeight: "bold",
              textAlign: "center",
              borderBottom: "2px solid #666",
              paddingBottom: "4px"
            }}
          >
            奥義
          </h3>

          {/* 奥義種別（旧：奥義名） */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px", marginBottom: "8px" }}>
            <label>奥義種別</label>
            <select value={ougiType} onChange={(e) => setOugiType(e.target.value)} style={inputStyle}>
              <option value="">選択してください</option>
              {ougiNames.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* 新規追加：奥義名（テキスト入力） */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px", marginBottom: "8px" }}>
            <label>奥義名</label>
            <input
              type="text"
              value={ougiName}
              onChange={(e) => setOugiName(e.target.value)}
              placeholder="奥義名を入力"
              style={inputStyle}
            />
          </div>

          {/* 指定特技カテゴリ */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px", marginBottom: "8px" }}>
            <label>指定特技カテゴリ</label>
            <select
              value={ougiSkillCategory}
              onChange={(e) => {
                setOugiSkillCategory(e.target.value);
                setOugiSkill("");
              }}
              style={inputStyle}
            >
              <option value="">カテゴリを選択してください</option>
              {Object.keys(skillsData.skills).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 指定特技 */}
          {ougiSkillCategory && (
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px", marginBottom: "8px" }}>
              <label>指定特技</label>
              <select value={ougiSkill} onChange={(e) => setOugiSkill(e.target.value)} style={inputStyle}>
                <option value="">特技を選択してください</option>
                {skillsData.skills[ougiSkillCategory].map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
          )}

          {/* 強み＋弱み セット */}
          <div
            style={{
              border: "1px solid #aaa",
              borderRadius: "6px",
              padding: "10px",
              marginBottom: "12px",
              backgroundColor: "#f7f7f7"
            }}
          >
            <h4 style={{ marginBottom: "8px" }}>強み・弱み</h4>

            {ougiAlterations.map((set, index) => {
              const strengthData = ougiAlteration.strength.find((s) => s.name === set.strength);
              const weaknessData = ougiAlteration.weakness.find((w) => w.name === set.weakness);

              return (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "10px",
                    marginBottom: "10px",
                    backgroundColor: "#fff"
                  }}
                >
                  {/* 表形式 */}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#eee" }}>
                        <th style={{ border: "1px solid #ccc", padding: "6px", width: "25%" }}>仕掛け</th>
                        <th style={{ border: "1px solid #ccc", padding: "6px", width: "25%" }}>対象</th>
                        <th style={{ border: "1px solid #ccc", padding: "6px" }}>概要</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* 強み */}
                      <tr>
                        {/* 仕掛け（強み） */}
                        <td
                          style={{ border: "1px solid #ccc", padding: "6px", cursor: "pointer" }}
                        >
                          <select
                            value={set.strength}
                            onChange={(e) => updateAlteration(index, "strength", e.target.value)}
                            style={{ width: "100%", padding: "4px" }}
                          >
                            <option value="">選択</option>
                            {ougiAlteration.strength.map((s) => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* 対象 */}
                        <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                          {strengthData ? strengthData.target.join(", ") : ""}
                        </td>

                        {/* 概要 */}
                        <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                          {strengthData ? strengthData.description : ""}
                        </td>
                      </tr>

                      {/* 弱み */}
                      <tr>
                        {/* 仕掛け（弱み） */}
                        <td
                          style={{ border: "1px solid #ccc", padding: "6px", cursor: "pointer" }}
                        >
                          <select
                            value={set.weakness}
                            onChange={(e) => updateAlteration(index, "weakness", e.target.value)}
                            style={{ width: "100%", padding: "4px" }}
                          >
                            <option value="">選択</option>
                            {ougiAlteration.weakness.map((w) => (
                              <option key={w.name} value={w.name}>{w.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* 対象 */}
                        <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                          {weaknessData ? weaknessData.target.join(", ") : ""}
                        </td>

                        {/* 概要 */}
                        <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                          {weaknessData ? weaknessData.description : ""}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 削除ボタン */}
                  {ougiAlterations.length > 1 && (
                    <button
                      onClick={() => removeAlterationSet(index)}
                      style={{
                        marginTop: "10px",
                        backgroundColor: "#ffdddd",
                        border: "1px solid #cc8888",
                        padding: "4px 8px",
                        borderRadius: "4px"
                      }}
                    >
                      − セット削除
                    </button>
                  )}
                </div>
              );
            })}

            {/* 追加ボタン */}
            <button
              onClick={addAlterationSet}
              style={{
                backgroundColor: "#ddffdd",
                border: "1px solid #88cc88",
                padding: "6px 10px",
                borderRadius: "4px"
              }}
            >
              ＋ セット追加
            </button>
          </div>

          {/* 効果 */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px" }}>
            <label style={{ alignSelf: "start" }}>効果</label>
            <textarea
              value={ougiEffect}
              onChange={(e) => setOugiEffect(e.target.value)}
              placeholder="効果"
              rows={4}
              style={{
                width: "100%",
                border: "1px solid #aaa",
                borderRadius: "4px",
                padding: "6px",
                fontSize: "0.9em"
              }}
            />
          </div>
        </div>


        {/* 忍具欄 */}
        <div
          style={{
            maxWidth: "900px",
            border: "2px solid #444",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#fafafa",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.1)"
          }}
        >
          <h3
            style={{
              marginBottom: "8px",
              fontSize: "1.3em",
              fontWeight: "bold",
              textAlign: "center",
              borderBottom: "2px solid #666",
              paddingBottom: "4px"
            }}
          >
            忍具
          </h3>

          {/* 3つを1行にまとめる */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 100px 1fr 100px 1fr",
              gap: "8px"
            }}
          >
            <label>兵糧丸</label>
            <input
              type="number"
              value={hyourogan}
              onChange={(e) => setHyourogan(e.target.value)}
              style={inputStyle}
            />

            <label>神通丸</label>
            <input
              type="number"
              value={jintsugan}
              onChange={(e) => setJintsugan(e.target.value)}
              style={inputStyle}
            />

            <label>遁甲符</label>
            <input
              type="number"
              value={tonkofu}
              onChange={(e) => setTonkofu(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>


        {/* 忍法欄 */}
        <h3>忍法</h3>
        {/* 選択した忍法一覧 */}
        <div style={{ margin: "15px 0" }}>
          <h4>選択した忍法一覧</h4>
          {selectedNinpo.length === 0 ? (
            <p>まだ忍法が選択されていません。</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "16px"
              }}
            >
              {selectedNinpo.map((name) => {
                const ninpo = allNinpoList.find((n) => n.name === name);
                if (!ninpo) return null;

                return (
                  <div
                    key={name}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "12px",
                      backgroundColor: "#fafafa",
                      boxShadow: "2px 2px 6px rgba(0,0,0,0.1)"
                    }}
                  >
                    <strong style={{ fontSize: "1.1em" }}>
                      {ninpo.name}（{ninpo.reading}）
                    </strong>
                    <div style={{ marginTop: "6px", fontSize: "0.9em" }}>
                      <span>種類: {ninpo.type}</span><br />
                      <span>間合: {ninpo.range}</span><br />
                      <span>コスト: {ninpo.cost}</span><br />
                      <span>指定特技: {ninpo.specifiedSkill}</span><br />
                      <span>階級: {ninpo.rank}</span><br />
                      <span>所属: {ninpo.faction} / サブ所属: {ninpo.subFaction}</span>
                    </div>

                    {/* タグ表示 */}
                    <div style={{ marginTop: "8px" }}>
                      {ninpo.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: "inline-block",
                            marginRight: "6px",
                            marginBottom: "4px",
                            padding: "2px 8px",
                            border: "1px solid #888",
                            borderRadius: "12px",
                            backgroundColor: "#eee",
                            fontSize: "0.85em"
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p style={{ marginTop: "8px", fontSize: "0.9em" }}>{ninpo.description}</p>
                    <small>出典: {ninpo.books.title} p.{ninpo.books.page}</small><br />

                    {/* 削除ボタン */}
                    <button
                      type="button"
                      onClick={() => handleNinpoToggle(name)}
                      style={{
                        marginTop: "10px",
                        padding: "4px 10px",
                        border: "1px solid #888",
                        borderRadius: "4px",
                        backgroundColor: "#f9f9f9",
                        cursor: "pointer"
                      }}
                    >
                      削除
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>




        {/* 検索バー */}
        <input
          type="text"
          placeholder="忍法を検索..."
          value={ninpoSearch}
          onChange={(e) => setNinpoSearch(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        {/* 所属フィルタ */}
        <label>所属フィルタ:</label><br />
        <select
          value={selectedFaction}
          onChange={(e) => setSelectedFaction(e.target.value)}
        >
          <option value="">すべて</option>
          {allNinpoData.map((f) => (
            <option key={f.faction} value={f.faction}>{f.faction}</option>
          ))}
        </select><br />

        {/* サブ所属フィルタ */}
        <label>サブ所属フィルタ:</label><br />
        <select
          value={selectedSubFaction}
          onChange={(e) => setSelectedSubFaction(e.target.value)}
        >
          <option value="">すべて</option>
          {Array.from(new Set(allNinpoList.map((n) => n.subFaction))).map((sf) => (
            <option key={sf} value={sf}>{sf}</option>
          ))}
        </select><br />
        {/* タイプフィルタ */}
        <label>タイプフィルタ:</label><br />
        <select
          value={ninpoTypeFilter}
          onChange={(e) => setNinpoTypeFilter(e.target.value)}
        >
          <option value="">すべて</option>
          <option value="攻撃忍法">攻撃忍法</option>
          <option value="サポート忍法">サポート忍法</option>
          <option value="装備忍法">装備忍法</option>
        </select><br />
        {/* タグフィルタ */}
        <label>タグフィルタ:</label><br />
        {["接近戦", "攻撃", "回復", "サポート"].map((tag) => (
          <label key={tag} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={ninpoTagFilters.includes(tag)}
              onChange={() => handleTagToggle(tag)}
            />
            {tag}
          </label>
        ))}

        {/* 間合いフィルタ */}
        <label>間合いフィルタ:</label><br />
        <select
          value={ninpoRangeFilter}
          onChange={(e) => setNinpoRangeFilter(e.target.value)}
        >
          <option value="">すべて</option>
          <option value="なし">なし</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select><br />

        {/* コストフィルタ */}
        <label>コストフィルタ:</label><br />
        <select
          value={ninpoCostFilter}
          onChange={(e) => setNinpoCostFilter(e.target.value)}
        >
          <option value="">すべて</option>
          <option value="なし">なし</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select><br />

        {/* 階級フィルタ */}
        <label>階級フィルタ:</label><br />
        <select
          value={ninpoRankFilter}
          onChange={(e) => setNinpoRankFilter(e.target.value)}
        >
          <option value="">すべて</option>
          <option value="制限なし">制限なし</option>
          <option value="中忍">中忍</option>
          <option value="中忍頭">中忍頭</option>
          <option value="上忍">上忍</option>
          <option value="上忍頭">上忍頭</option>
          <option value="頭領">頭領</option>
        </select><br />

        {/* ✅ ここに「UI例（フィルタ条件表示）」を置く */}
        <div style={{ margin: "10px 0" }}>
          <strong>現在の条件:</strong>
          {ninpoSearch && <span> 検索="{ninpoSearch}" </span>}
          {ninpoTypeFilter && <span> 種類={ninpoTypeFilter} </span>}
          {ninpoRangeFilter && <span> 間合い={ninpoRangeFilter} </span>}
          {ninpoCostFilter && <span> コスト={ninpoCostFilter} </span>}
          {ninpoRankFilter && <span> 階級={ninpoRankFilter} </span>}
          {ninpoTagFilters.length > 0 && <span> タグ={ninpoTagFilters.join(", ")} </span>}
        </div>

        {/* フィルタリセットボタン */}
        <button
          type="button"
          onClick={resetNinpoFilters}
          style={{
            marginTop: "10px",
            padding: "6px 12px",
            border: "1px solid #888",
            borderRadius: "4px",
            backgroundColor: "#f0f0f0",
            cursor: "pointer"
          }}
        >
          フィルタをすべてリセット
        </button>

        {/* 忍法一覧 */}
        {filteredNinpo.map((n) => (
          <div
            key={n.name}
            style={{
              marginBottom: "10px",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "6px"
            }}
          >
            <input
              type="checkbox"
              checked={selectedNinpo.includes(n.name)}
              onChange={() => handleNinpoToggle(n.name)}
            />
            <strong>{n.name}（{n.reading}）</strong><br />
            <span>種類: {n.type}</span><br />
            <span>間合: {n.range}</span><br />
            <span>コスト: {n.cost}</span><br />
            <span>指定特技: {n.specifiedSkill}</span><br />
            <span>階級: {n.rank}</span><br />

            {/* タグをクリック可能にする（複数選択対応） */}
            <div style={{ marginTop: "5px" }}>
              {n.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  style={{
                    marginRight: "5px",
                    padding: "2px 6px",
                    border: "1px solid #888",
                    borderRadius: "4px",
                    backgroundColor: ninpoTagFilters.includes(tag) ? "#ddd" : "#f9f9f9",
                    cursor: "pointer"
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <p style={{ marginTop: "5px" }}>{n.description}</p>
            <small>出典: {n.books.title} p.{n.books.page}</small><br />
            <small>備考: {n.notes}</small>
          </div>
        ))}

      </form>
      <button onClick={handleDelete} style={{ marginTop: "10px", color: "red" }}>
        削除
      </button>
      <p>{message}</p>
    </div>
  );
}
