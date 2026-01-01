
import { Route, Routes } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'

const ClerkProtected = ({children}) => (

  <>
  <SignedIn>{children}</SignedIn>
  <SignedOut>
    <RedirectToSignIn />
  </SignedOut>
  </>
)


const App = () =>{
  return (
  <div className='min-h-screen max-w-full overflow-x-hidden'>
     <Routes>
    <Route path = '/' element= {<Home/>}/>
    <Route path='/app' element={<ClerkProtected>
      <AppShell />
    </ClerkProtected>} >
    <Route index element={<Dashboard />}  />
    <Route path="dashboard" element={<Dashboard />} />
    </Route>
   </Routes>

  </div>

  )
}

export default App
