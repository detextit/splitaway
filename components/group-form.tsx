'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { UserPlus, Trash2, X } from 'lucide-react'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "./ui/menubar"

export type GroupMember = {
    name: string
    email: string
}

export type Group = {
    id: string
    name: string
    members: GroupMember[]
}

export interface GroupFormProps {
    onGroupCreate: (group: Group) => void
    onGroupDelete?: (groupId: string) => void
    existingGroup?: Group | null
    defaultMember?: { name: string; email: string }
}

export function GroupForm({ onGroupCreate, onGroupDelete, existingGroup, defaultMember }: GroupFormProps) {
    const [groupName, setGroupName] = useState(existingGroup?.name || '')
    const [members, setMembers] = useState<{ name: string; email: string }[]>(
        existingGroup?.members || (defaultMember ? [defaultMember] : [])
    )
    const [newMember, setNewMember] = useState('')

    // Add this effect to reset form when existingGroup changes
    useEffect(() => {
        setGroupName(existingGroup?.name || '')
        setMembers(existingGroup?.members || (defaultMember ? [defaultMember] : []))
        setNewMember('')
    }, [existingGroup, defaultMember])

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
            id: existingGroup?.id || crypto.randomUUID(),
            name: groupName,
            members
        }

        onGroupCreate(newGroup)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{existingGroup ? 'Edit Group' : 'Create Group'}</CardTitle>
                <Menubar className="border-none p-0">
                    <MenubarMenu>
                        <MenubarTrigger
                            onClick={addMember}
                            className="cursor-pointer gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Member
                        </MenubarTrigger>
                    </MenubarMenu>
                    {existingGroup && onGroupDelete && (
                        <MenubarMenu>
                            <MenubarTrigger
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this group?')) {
                                        onGroupDelete(existingGroup.id)
                                    }
                                }}
                                className="cursor-pointer gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Group
                            </MenubarTrigger>
                        </MenubarMenu>
                    )}
                </Menubar>
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
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMember(index)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Remove</span>
                                </Button>
                            )}
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button type="submit">
                            {existingGroup ? 'Update Group' : 'Create Group'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
} 