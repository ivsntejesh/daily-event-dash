
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AccountPage = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in">
      <Card className="card-gradient shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-display">Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email:</label>
              <p className="text-lg font-medium mt-1">{user?.email}</p>
            </div>
            <Button onClick={signOut} variant="outline" className="hover-lift">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
