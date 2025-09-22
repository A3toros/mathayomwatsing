import { motion } from 'framer-motion'

const Card = ({ 
  children, 
  hover = true,
  className = '',
  ...props 
}) => {
  const cardClasses = `
    bg-white rounded-xl shadow-md border border-gray-200 p-6
    ${hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200' : ''}
    ${className}
  `

  return (
    <motion.div
      className={cardClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Card sub-components
const CardHeader = ({ children, className = '' }) => (
  <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-gray-800 ${className}`}>
    {children}
  </h3>
)

const CardBody = ({ children, className = '' }) => (
  <div className={`py-4 ${className}`}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '' }) => (
  <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
    {children}
  </div>
)

// Attach sub-components to main Card component
Card.Header = CardHeader
Card.Title = CardTitle
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
