"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      // Here you would typically send this file to your backend
      console.log("Uploading file:", file.name)
      // Reset form
      setFile(null)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Upload Expenses</CardTitle>
        <CardDescription>Upload a CSV file with your expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={!file}>
            Upload
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}