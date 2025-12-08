import { useEffect, useState } from "react";

const Users = ({ users, useNicknames, showWithDelay = false, animation, extra }) => {
  const [displayUsers, setDisplayUsers] = useState([]);

  useEffect(() => {
    console.log("ce plm?", users);
    setDisplayUsers([]);
    if (!users || users.length === 0) setDisplayUsers([]);

    if (!showWithDelay) {
      setDisplayUsers(users);
      return;
    }

    let index = 0;

    const interval = setInterval(() => {
      setDisplayUsers(prev => {
        if (index >= users.length) {
          clearInterval(interval);
          return prev;
        }

        const nextUser = users[index];
        index += 1;

        return [...prev, nextUser];
      });
    }, showWithDelay);

    return () => clearInterval(interval);
  }, [users]);

  return (
    <div className="users">
      {displayUsers.map((user) => (
        <div 
          key={user.user_id} 
          className={`user ${animation || ""} ${user.isDisconnected ? "disconnected" : ""}`}
        >
          <div className="avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : (
              <span>{user.nickname ? user.nickname[0] : "..."}</span>
            )}
          </div>

          {useNicknames && <span>{user.nickname}</span>}

          {extra && extra[user.user_id] && (
            <div className="label">{extra[user.user_id]}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Users;
