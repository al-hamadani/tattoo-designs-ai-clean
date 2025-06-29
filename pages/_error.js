import * as Sentry from '@sentry/nextjs'
import NextErrorComponent from 'next/error'

const CustomErrorComponent = props => {
  return <NextErrorComponent statusCode={props.statusCode} />
}

CustomErrorComponent.getInitialProps = async contextData => {
  await Sentry.captureUnderscoreErrorException(contextData)
  
  const errorInitialProps = await NextErrorComponent.getInitialProps(contextData)
  
  return errorInitialProps
}

export default CustomErrorComponent