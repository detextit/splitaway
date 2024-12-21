'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Item, Receipt } from '@/app/page'

interface ReceiptUploadProps {
    onReceiptProcessed: (receipt: Receipt, items: Item[]) => void
}

export function ReceiptUpload({ onReceiptProcessed }: ReceiptUploadProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setLoading(true)
        setError(null)

        try {
            // Create form data
            const formData = new FormData()
            formData.append('image', file)

            // Send to our API endpoint
            const response = await fetch('/api/process-receipt', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Failed to process receipt')

            const data = await response.json()
            onReceiptProcessed(data.receipt, data.items)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process receipt')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Receipt</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="receipt-upload"
                    />
                    <Button
                        onClick={() => document.getElementById('receipt-upload')?.click()}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Upload Receipt'}
                    </Button>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
            </CardContent>
        </Card>
    )
} 