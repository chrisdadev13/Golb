import { Footer } from '#/components/marketing/footer'
import { Header } from '#/components/marketing/header'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
</>
  )
}