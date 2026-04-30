import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, HandCoins, Receipt, ShoppingCart, CheckSquare, MessageSquare, UserCheck } from 'lucide-react';

export default function NavBar() {
  const location = useLocation();
  const groupMatch = location.pathname.match(/^\/groups\/([^/]+)/);
  const groupId = groupMatch?.[1];

  if (groupId) {
    const tabs = [
      { to: `/groups/${groupId}/expenses`, label: 'Expenses', Icon: Receipt },
      { to: `/groups/${groupId}/shopping`, label: 'Shopping', Icon: ShoppingCart },
      { to: `/groups/${groupId}/chores`, label: 'Chores', Icon: CheckSquare },
      { to: `/groups/${groupId}/messages`, label: 'Chat', Icon: MessageSquare },
      { to: `/groups/${groupId}/members`, label: 'Members', Icon: UserCheck },
    ];
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }

  const tabs = [
    { to: '/dashboard', label: 'Home', Icon: Home },
    { to: '/groups', label: 'Groups', Icon: Users },
    { to: '/friends', label: 'Friends', Icon: HandCoins },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
