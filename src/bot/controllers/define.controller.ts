export interface DefinitionResult {
  text: string;
  audioBuffer?: Buffer;
  audioFileName?: string;
}

export async function getWordDefinition(word: string): Promise<DefinitionResult> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  const res = await fetch(url);

  if (!res.ok) {
    return { text: `❌ Could not find the word "*${word}*".` };
  }

  const data = await res.json() as any[];

  const firstPhoneticText = data.find(d => d.phonetic)?.phonetic ||
    data.flatMap(d => d.phonetics).find(p => p?.text)?.text || '';

  const firstAudio = data.flatMap(d => d.phonetics).find(p => p?.audio?.startsWith("https://"));
  const audioUrl = firstAudio?.audio;

  let message = `🔤 *Word:* ${word}\n`;
  if (firstPhoneticText) message += `📖 *Phonetic:* ${firstPhoneticText}\n`;
  message += `\n🧠 *Meanings:*\n`;

  const processed = new Set(); 

  for (const entry of data) {
    for (const meaning of entry.meanings) {
      const key = `${meaning.partOfSpeech}-${JSON.stringify(meaning.definitions)}`;
      if (processed.has(key)) continue;
      processed.add(key);

      message += `\n \\_ _${meaning.partOfSpeech}_ \\_\n`;

      const defs = meaning.definitions.slice(0, 3); // limit to 3 definitions per part of speech
      for (const def of defs) {
        message += `• ${def.definition}\n`;
        if (def.example) message += `  _Example_: "${def.example}"\n`;
      }

      const allSynonyms = new Set<string>();
      meaning.synonyms?.forEach((s: string) => allSynonyms.add(s));
      defs.forEach((d: { synonyms: string[]; }) => d.synonyms?.forEach((s: string) => allSynonyms.add(s)));

      if (allSynonyms.size > 0) {
        message += `  _Synonyms_: ${Array.from(allSynonyms).slice(0, 5).join(', ')}\n`;
      }
    }
  }

  message += `\n 🎓 Powered by NezaAI`;

  // Fetch audio
  let audioBuffer: Buffer | undefined;
  let audioFileName: string | undefined;

  if (audioUrl) {
    try {
      const audioRes = await fetch(audioUrl);
      if (audioRes.ok) {
        const arrayBuffer = await audioRes.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        audioFileName = `${word}`;
      }
    } catch (e) {
      console.error("Failed to fetch audio:", e);
    }
  }

  return { text: message, audioBuffer, audioFileName };
}
