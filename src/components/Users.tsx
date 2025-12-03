
const Users = ({users, useNicknames, extra}) => {
  console.log(extra);
  return (
    <div className="users">
      {users.map((user) => (
        <div key={user.username} className={`user ${user.isDisconnected ? 'disconnected' : ''}`}>
          <div className='avatar'>{user.avatar ? <img src={user.avatar} alt="avatar"/> : <span>{user.nickname? user.nickname[0]: '...'}</span>}</div>
          {useNicknames && <span>{user.nickname}</span>}
          {(extra && extra[user.user_id]) && <div className={'label'}>{extra[user.user_id]}</div>}
        </div>
      ))}
    </div>
  )
}

export default Users;