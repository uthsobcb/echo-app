import JournalEntryBox from '@/component/JournalEntryBox'
import React from 'react'
import { View } from 'react-native'

export default function Create() {
    const handleSubmit = (entry: any) => {
        console.log('Entry submitted:', entry)
        // Handle entry submission here
    }

    const handleGetPrompt = () => {
        console.log('Get prompt')
    }

    const handleVoiceRecord = () => {
        console.log('Start voice recording')
    }

    const handleAttachImage = () => {
        console.log('Attach image')
    }

    const handleScanHandwriting = () => {
        console.log('Scan handwriting')
    }

    return (
        <View className="flex-1 bg-white">
            <JournalEntryBox
                onSubmit={handleSubmit}
                onGetPrompt={handleGetPrompt}
                onVoiceRecord={handleVoiceRecord}
                onAttachImage={handleAttachImage}
                onScanHandwriting={handleScanHandwriting}
            />
        </View>
    )
}