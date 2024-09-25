import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import { Layout } from "@/components/layout"
import { ExpenseForm } from "@/components/expense-form"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for demonstration purposes
const mockDebts = [
  { name: "Alice", amount: 50 },
  { name: "Bob", amount: -30 },
  { name: "Charlie", amount: 20 },
]

export default async function Home() {
  const session = await getServerSession(authOptions)

  const youOwe = mockDebts.filter(debt => debt.amount < 0).reduce((sum, debt) => sum - debt.amount, 0)
  const othersOwe = mockDebts.filter(debt => debt.amount > 0).reduce((sum, debt) => sum + debt.amount, 0)

  return (
    <Layout>
      <div className="flex flex-col md:flex-row p-4 gap-8">
        <div className="w-full md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Balance Summary</CardTitle>
              <CardDescription>Your current balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>You owe:</span>
                  <span className="text-red-500 font-bold">${youOwe.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Others owe you:</span>
                  <span className="text-green-500 font-bold">${othersOwe.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Detailed Breakdown:</h3>
                  <ul className="space-y-2">
                    {mockDebts.map((debt, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{debt.name}</span>
                        <span className={debt.amount < 0 ? "text-red-500" : "text-green-500"}>
                          ${Math.abs(debt.amount).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-1/2 space-y-8">
          <ExpenseForm />
          <FileUpload />
        </div>
      </div>
    </Layout>
  )
}