import ExGather.Factory

# Create default workspace
insert(:workspace, %{id: 1, name: "Workspace", uid: "WORKSPACE"})

# Create default users
insert(:user, %{id: 1, email: "test@test.com", hashed_password: Bcrypt.hash_pwd_salt("test@test.com")})
insert(:user_workspaces, %{user_id: 1, workspace_id: 1})

insert(:user, %{id: 2, email: "dev@dev.com", hashed_password: Bcrypt.hash_pwd_salt("dev@dev.com")})
insert(:user_workspaces, %{user_id: 2, workspace_id: 1})
