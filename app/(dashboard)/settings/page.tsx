import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CashBufferEditor } from '@/components/settings/cash-buffer-editor'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // Auto-create user if they exist in Clerk but not in the database
  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      redirect('/sign-in')
    }

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        imageUrl: clerkUser.imageUrl,
      },
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Cash Buffer Setting */}
      <CashBufferEditor initialValue={user.cashBuffer} />

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected accounting software
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Xero */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#13B5EA] rounded flex items-center justify-center text-white font-bold">
                X
              </div>
              <div>
                <p className="font-medium">Xero</p>
                {user.xeroConnectedAt ? (
                  <p className="text-sm text-green-600">
                    Connected{' '}
                    {user.xeroConnectedAt.toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
            </div>
            {user.xeroConnectedAt ? (
              <Button variant="outline" size="sm">
                Disconnect
              </Button>
            ) : (
              <Button size="sm" asChild>
                <a href="/api/xero/connect">Connect</a>
              </Button>
            )}
          </div>

          {/* QuickBooks */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2CA01C] rounded flex items-center justify-center text-white font-bold">
                Q
              </div>
              <div>
                <p className="font-medium">QuickBooks</p>
                {user.qbConnectedAt ? (
                  <p className="text-sm text-green-600">
                    Connected{' '}
                    {user.qbConnectedAt.toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
            </div>
            {user.qbConnectedAt ? (
              <Button variant="outline" size="sm">
                Disconnect
              </Button>
            ) : (
              <Button size="sm" asChild>
                <a href="/api/quickbooks/connect">Connect</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your billing and subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {user.plan || 'Free'} Plan
              </p>
              <p className="text-sm text-muted-foreground">
                {user.planStatus === 'active'
                  ? 'Your subscription is active'
                  : 'Upgrade to unlock more features'}
              </p>
            </div>
            <Button variant={user.plan === 'FREE' ? 'default' : 'outline'}>
              {user.plan === 'FREE' ? 'Upgrade' : 'Manage'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
