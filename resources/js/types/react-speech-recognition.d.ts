declare module 'react-speech-recognition' {
    export interface SpeechRecognitionOptions {
        transcripts?: string;
        listening?: boolean;
        commands?: any[];
        continuous?: boolean;
        language?: string;
    }

    export interface SpeechRecognition {
        startListening: (options?: SpeechRecognitionOptions) => Promise<void>;
        stopListening: () => Promise<void>;
        abortListening: () => Promise<void>;
        browserSupportsSpeechRecognition: boolean;
    }

    export function useSpeechRecognition(options?: any): {
        transcript: string;
        listening: boolean;
        resetTranscript: () => void;
        browserSupportsSpeechRecognition: boolean;
        isMicrophoneAvailable: boolean;
    };

    const SpeechRecognition: SpeechRecognition;
    export default SpeechRecognition;
}
