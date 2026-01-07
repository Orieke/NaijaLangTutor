import { useEffect, useState } from 'react';
import { 
  Search,
  UserCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MoreVertical
} from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';

const roleLabels: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  learner: { label: 'Learner', color: 'bg-gray-100 text-gray-700', icon: UserCircle },
  contributor: { label: 'Contributor', color: 'bg-blue-100 text-blue-700', icon: Shield },
  reviewer: { label: 'Reviewer', color: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: ShieldAlert },
};

export function UsersPage() {
  const { users, fetchUsers, updateUserRole, isLoading } = useAdminStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
    setOpenMenu(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ohafia-sand-50 mb-2">User Management</h1>
        <p className="text-gray-600 dark:text-ohafia-sand-300">
          Manage user roles and permissions
        </p>
      </header>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-ohafia-sand-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-600 bg-white dark:bg-ohafia-earth-800 text-gray-900 dark:text-ohafia-sand-100 focus:outline-none focus:ring-2 focus:ring-ohafia-primary focus:border-transparent"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-600 bg-white dark:bg-ohafia-earth-800 text-gray-900 dark:text-ohafia-sand-100 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
        >
          <option value="all">All Roles</option>
          <option value="learner">Learners</option>
          <option value="contributor">Contributors</option>
          <option value="reviewer">Reviewers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-8 text-center">
          <div className="w-8 h-8 border-4 border-ohafia-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-ohafia-sand-400 mt-4">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-ohafia-earth-900 border-b border-gray-200 dark:border-ohafia-earth-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-ohafia-sand-400">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-ohafia-sand-400">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-ohafia-sand-400">Joined</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-ohafia-sand-400">Last Active</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-ohafia-sand-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-ohafia-earth-700">
                {filteredUsers.map(user => {
                  const role = roleLabels[user.role] || roleLabels.learner;
                  const RoleIcon = role.icon;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-ohafia-earth-700">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-ohafia-sand-200 dark:bg-ohafia-earth-600 flex items-center justify-center">
                            <span className="text-ohafia-earth-600 dark:text-ohafia-sand-200 font-medium">
                              {user.display_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-ohafia-sand-50">
                              {user.display_name || 'Unnamed User'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-ohafia-sand-400 truncate max-w-[200px]">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {role.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-ohafia-sand-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-ohafia-sand-400">
                        {user.last_active_at 
                          ? new Date(user.last_active_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-ohafia-earth-700 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-ohafia-sand-400" />
                          </button>

                          {openMenu === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-ohafia-earth-800 rounded-xl shadow-lg border border-gray-200 dark:border-ohafia-earth-700 py-1 z-10">
                              <p className="px-4 py-2 text-xs text-gray-500 dark:text-ohafia-sand-400 border-b border-gray-100 dark:border-ohafia-earth-700">
                                Change Role
                              </p>
                              {Object.entries(roleLabels).map(([key, { label }]) => (
                                <button
                                  key={key}
                                  onClick={() => handleRoleChange(user.id, key)}
                                  disabled={user.role === key}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-ohafia-earth-700
                                    ${user.role === key ? 'text-ohafia-primary font-medium' : 'text-gray-700 dark:text-ohafia-sand-200'}`}
                                >
                                  {label}
                                  {user.role === key && ' ✓'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center">
              <UserCircle className="w-12 h-12 text-gray-300 dark:text-ohafia-earth-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-ohafia-sand-400">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
