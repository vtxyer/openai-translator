// eslint-disable-next-line prettier/prettier
import { commands } from './bindings'

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

export async function startDictation() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream)
        // eslint-disable-next-line prettier/prettier
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data)
        }

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
            const reader = new FileReader()
            reader.onload = async (e) => {
                if (e.target && e.target.result) {
                    const base64Audio = (e.target.result as string).split(',')[1]
                    await transcribeAudio(base64Audio)
                }
            }
            reader.readAsDataURL(audioBlob)
            audioChunks = []
        }

        mediaRecorder.start()
    } catch (error) {
        console.error('Error starting dictation:', error)
    }
}

export function stopDictation() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
    }
}

async function transcribeAudio(base64Audio: string) {
    try {
        const response = await commands.transcribeAudio(base64Audio)
        if (response.status === 'ok') {
            commands.writeToInput(response.data.text)
        } else {
            console.error('Transcription error:', response.error)
        }
    } catch (error) {
        console.error('Error transcribing audio:', error)
    }
}
