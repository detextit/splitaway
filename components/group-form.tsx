'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { UserPlus, Trash2, X, AlertCircle } from 'lucide-react'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "./ui/menubar"
import { useSession } from 'next-auth/react'
import { Alert, AlertDescription } from './ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

export type GroupMember = {
    name: string
    email?: string
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
    const [members, setMembers] = useState<{ name: string; email?: string }[]>(
        existingGroup?.members || (defaultMember ? [defaultMember] : [])
    )
    const [newMember, setNewMember] = useState('')
    const { data: session } = useSession()
    const isOwner = session?.user?.email === existingGroup?.owner_email

    // Add new states for tracking member removal
    const [membersInExpenses, setMembersInExpenses] = useState<string[]>([])
    const [attemptedRemovals, setAttemptedRemovals] = useState<string[]>([])

    // Add effect to check members in expenses when group changes
    useEffect(() => {
        async function checkMembersInExpenses() {
            if (existingGroup?.id) {
                const response = await fetch(`/api/groups/${existingGroup.id}/members-in-expenses`)
                if (response.ok) {
                    const data = await response.json()
                    setMembersInExpenses(data.members)
                }
            }
        }

        checkMembersInExpenses()
    }, [existingGroup?.id])

    // Add this effect to reset form when existingGroup changes
    useEffect(() => {
        setGroupName(existingGroup?.name || '')
        setMembers(existingGroup?.members || (defaultMember ? [defaultMember] : []))
        setNewMember('')
    }, [existingGroup, defaultMember])

    const addMember = () => {
        setMembers([...members, { name: '' }])
    }

    const updateMember = (index: number, field: keyof GroupMember, value: string) => {
        const newMembers = [...members]
        if (field === 'email' && !isOwner) {
            return
        }
        newMembers[index][field] = value
        setMembers(newMembers)
    }

    const removeMember = (index: number) => {
        const memberToRemove = members[index]
        if (membersInExpenses.includes(memberToRemove.name)) {
            setAttemptedRemovals(prev => [...prev, memberToRemove.name])
            return
        }

        if (members.length > 1) {
            const newMembers = members.filter((_, i) => i !== index)
            setMembers(newMembers)
            setAttemptedRemovals(prev => prev.filter(name => name !== memberToRemove.name))
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

    // Add function to check if update should be disabled
    const isUpdateDisabled = () => {
        return attemptedRemovals.length > 0 || !groupName.trim()
    }

    // Update the isOwner check to allow email field for new groups
    const isOwnerOrNew = isOwner || !existingGroup

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

                    {/* Show warning for attempted removals */}
                    {attemptedRemovals.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Cannot remove the following members as they are part of existing expenses:
                                {attemptedRemovals.join(', ')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {members.map((member, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="Name"
                                    value={member.name}
                                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                                />
                                {isOwnerOrNew && (
                                    <Input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={member.email || ''}
                                        onChange={(e) => updateMember(index, 'email', e.target.value)}
                                    />
                                )}
                            </div>
                            {members.length > 1 && isOwnerOrNew && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMember(index)}
                                                    className="h-8 w-8 p-0"
                                                    disabled={membersInExpenses.includes(member.name)}
                                                    style={membersInExpenses.includes(member.name) ?
                                                        { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                                                >
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Remove</span>
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {membersInExpenses.includes(member.name)
                                                ? "Cannot remove: Member is part of existing expenses"
                                                : "Remove member"
                                            }
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={isUpdateDisabled()}
                        >
                            {existingGroup ? 'Update Group' : 'Create Group'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
} 