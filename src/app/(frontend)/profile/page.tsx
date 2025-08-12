import { getMeUser } from '../../../utilities/getMeUser'
import { ProfileClient } from './page.client'

export default async function ProfilePage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  return <ProfileClient user={user} />
}