// controllers/define.controller.ts
export interface DefinitionResult {
    text: string;
    audioBuffer?: Buffer;
    audioFileName?: string;
  }
  
  export async function getWordDefinition(word: string): Promise<DefinitionResult> {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Could not find the word "${word}".`);
    }
  
    const data = await res.json() as any;
    const entry = data[0];
  
    let message = `📖 *Word:* ${entry.word}\n`;
    if (entry.phonetic) message += `🔊 *Pronunciation:* ${entry.phonetic}\n`;
    if (entry.origin) message += `📜 *Origin:* ${entry.origin}\n`;
  
    for (const meaning of entry.meanings) {
      const def = meaning.definitions[0];
      message += `\n🔹 *Part of Speech:* ${meaning.partOfSpeech}\n`;
      message += `🧠 *Definition:* ${def.definition}\n`;
      if (def.example) message += `💬 *Example:* "${def.example}"\n`;
    }
  
    // Fetch audio file
    const audioUrl = entry.phonetics.find((p: any) => p.audio)?.audio;
    let audioBuffer: Buffer | undefined;
    let audioFileName: string | undefined;
  
    if (audioUrl) {
      const audioRes = await fetch(`https:${audioUrl}`); // audio URL is missing https:
      if (audioRes.ok) {
        audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        audioFileName = `${entry.word}.mp3`;
      }
    }
  
    return { text: message, audioBuffer, audioFileName };
  }
  