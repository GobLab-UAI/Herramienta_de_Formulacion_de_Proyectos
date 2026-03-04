

## Plan: Authentication System with Formulador/Consultor Roles

### Overview
Replace the current public-access role switcher with real authentication. Formuladores register with full profile data; the Consultor is a single pre-seeded user (admin2026/consultor2026). No email verification for anyone.

### Database Changes

1. **Alter `profiles` table**: Add `username` (unique, not null) and `entidad` (text) columns
2. **Add enum values**: Add `FORMULADOR` and `CONSULTOR` to `app_role` enum
3. **Enable auto-confirm**: Disable email verification via configure-auth tool
4. **Update `handle_new_user` trigger**: Store username and entidad from user metadata, assign FORMULADOR role by default
5. **Seed consultor user**: Create user `admin2026` with dummy email `admin2026@goblab.local`, password `consultor2026`, and assign CONSULTOR role in user_roles. This will be done via an edge function that uses the service role key to create the user programmatically on first deploy.

### New Pages/Components

1. **`src/pages/Login.tsx`**: Login form accepting username + password. Looks up email from profiles by username, then calls `supabase.auth.signInWithPassword`. Special case: if username is "admin2026", use the known dummy email directly.

2. **`src/pages/Register.tsx`**: Registration form for Formuladores only. Fields: username, nombre completo, correo, cargo, entidad, contraseña. Calls `supabase.auth.signUp` with metadata.

3. **`src/contexts/AuthContext.tsx`**: Replace RoleContext. Provides current user session, profile, role (FORMULADOR/CONSULTOR), loading state, and logout function. Uses `onAuthStateChange` + `getSession`. Queries `user_roles` to determine role.

### Modified Files

1. **`src/App.tsx`**: Replace RoleProvider with AuthProvider. Add login/register routes. Wrap dashboard/editor routes in a ProtectedRoute component that redirects to `/login` if not authenticated.

2. **`src/components/Topbar.tsx`**: Remove role switcher buttons. Show current user's name and role. Add logout button.

3. **`src/pages/Dashboard.tsx`**:
   - Formulador: query projects where `created_by = currentUser.id`
   - Consultor: query all projects, join with profiles to show creator name
   - Remove ANON_USER_ID usage
   - ProjectCard for consultor shows creator name

4. **`src/pages/ProjectEditor.tsx`**: Use `auth.uid()` instead of ANON_USER_ID for all mutations (save, comments, history).

5. **`src/components/ProjectCard.tsx`**: Add optional `creatorName` prop displayed when in consultor view.

6. **`src/components/editor/CommentBubble.tsx`** and related: Use real user ID from auth context.

### Auth Flow

- `/login` - both roles login here with username + password
- `/register` - only formuladores can register
- After login, redirect to `/dashboard`
- Role is determined from `user_roles` table, not localStorage
- The consultor user is pre-created; no registration path for consultors

### Security Note
The consultor credentials (admin2026/consultor2026) are hardcoded as requested. The dummy email lookup for username-based login is handled client-side for simplicity since this is a low-security internal tool.

