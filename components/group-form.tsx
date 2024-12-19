'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'

export type GroupMember = {
    name: string
    email: string
}

export type Group = {
    name: string
    members: GroupMember[]
}

export interface GroupFormProps {
    onGroupCreate: (group: Group) => void
    existingGroup?: Group | null
}

export function GroupForm({ onGroupCreate, existingGroup }: GroupFormProps) {
    const [groupName, setGroupName] = useState('')
    const [members, setMembers] = useState<GroupMember[]>([{ name: '', email: '' }])

    // Populate form when existingGroup changes
    useEffect(() => {
        if (existingGroup) {
            setGroupName(existingGroup.name)
            setMembers(existingGroup.members)
        }
    }, [existingGroup])

    const addMember = () => {
        setMembers([...members, { name: '', email: '' }])
    }

    const updateMember = (index: number, field: keyof GroupMember, value: string) => {
        const newMembers = [...members]
        newMembers[index][field] = value
        setMembers(newMembers)
    }

    const removeMember = (index: number) => {
        if (members.length > 1) {
            const newMembers = members.filter((_, i) => i !== index)
            setMembers(newMembers)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!groupName.trim()) {
            alert('Please enter a group name')
            return
        }

        const newGroup: Group = {
            name: groupName,
            members
        }

        onGroupCreate(newGroup)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{existingGroup ? 'Edit Group' : 'Create Group'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                    {members.map((member, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="Name"
                                    value={member.name}
                                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                                />
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={member.email}
                                    onChange={(e) => updateMember(index, 'email', e.target.value)}
                                />
                            </div>
                            {members.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeMember(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={addMember}>
                            Add Member
                        </Button>
                        <Button type="submit">
                            {existingGroup ? 'Update Group' : 'Create Group'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
} 