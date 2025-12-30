-- Add goal_amount column if it doesn't exist
alter table group_members 
add column if not exists goal_amount numeric default 0;

-- Ensure RLS allows owners to update members (specifically for setting goals)
-- We'll create a policy allowing updates if the user is the owner of the group
drop policy if exists "Owners can update members" on group_members;

create policy "Owners can update members"
on group_members for update
using (
  exists (
    select 1 from groups
    where groups.id = group_members.group_id
    and groups.owner_id = auth.uid()
  )
);

-- Note: The read policy should already be in place from previous fixes.
