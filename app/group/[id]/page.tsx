import Home from "@/app/page"

export default function GroupPage({ params }: { params: { id: string } }) {
    return <Home initialGroupId={params.id} />
} 