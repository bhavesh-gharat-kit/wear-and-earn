import { useEffect } from 'react'

export default function LoginRegister() {
	useEffect(() => {
		// Redirect to the new login route while preserving any referral params
		const params = typeof window !== 'undefined' ? window.location.search : ''
		window.location.replace(`/login${params}`)
	}, [])
	return null
}
