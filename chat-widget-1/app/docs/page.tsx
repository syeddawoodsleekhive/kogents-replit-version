import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:underline flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Chat Widget Documentation</h1>

      <div className="prose prose-lg max-w-none">
        <h2 id="basic-integration">Basic Integration</h2>
        <p>Add the following script tag to your website's HTML:</p>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`<script 
  src="${process.env.NEXT_PUBLIC_WIDGET_URL || "https://your-domain.com"}/api/widget" 
  id="kogents-chat-widget"
  data-position="right"
  data-color="#3B82F6"
></script>`}
        </pre>
        <p>
          Place this script tag just before the closing <code>&lt;/body&gt;</code> tag for optimal performance.
        </p>

        <h2 id="configuration-options">Configuration Options</h2>
        <p>You can configure the widget using data attributes on the script tag:</p>
        <table className="min-w-full border border-gray-300 my-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Attribute</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>data-position</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Widget position, either "right" or "left"</td>
              <td className="border border-gray-300 px-4 py-2">"right"</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>data-color</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Primary color for the widget</td>
              <td className="border border-gray-300 px-4 py-2">"#3B82F6"</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>data-auto-open</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Automatically open the widget on page load</td>
              <td className="border border-gray-300 px-4 py-2">"false"</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>data-greeting</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Custom greeting message</td>
              <td className="border border-gray-300 px-4 py-2">""</td>
            </tr>
          </tbody>
        </table>

        <h2 id="javascript-api">JavaScript API</h2>
        <p>The widget exposes a JavaScript API that you can use to control it programmatically:</p>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`// Open the widget
KogentsChatWidget.open();

// Close the widget
KogentsChatWidget.close();

// Toggle the widget (open if closed, close if open)
KogentsChatWidget.toggle();

// Check if the widget is open
KogentsChatWidget.isOpen().then(isOpen => {
  console.log('Widget is open:', isOpen);
});

// Identify the user
KogentsChatWidget.identify({
  name: 'John Doe',
  email: 'john@example.com',
  id: '123456'
});

// Update configuration
KogentsChatWidget.updateConfig({
  color: '#00FF00',
  greeting: 'Welcome back!'
});

// Listen for events
KogentsChatWidget.on('message:received', message => {
  console.log('New message received:', message);
});

// Remove event listener
const messageHandler = message => {
  console.log('Message:', message);
};
KogentsChatWidget.on('message:received', messageHandler);
KogentsChatWidget.off('message:received', messageHandler);`}
        </pre>

        <h2 id="events">Events</h2>
        <p>You can listen for the following events:</p>
        <table className="min-w-full border border-gray-300 my-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Event</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>ready</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Widget is loaded and ready</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>open</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Widget is opened</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>close</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Widget is closed</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>message:sent</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">User sent a message</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>message:received</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Agent sent a message</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>file:sent</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">User sent a file</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <code>file:received</code>
              </td>
              <td className="border border-gray-300 px-4 py-2">Agent sent a file</td>
            </tr>
          </tbody>
        </table>

        <h2 id="advanced-usage">Advanced Usage</h2>
        <h3 id="custom-styling">Custom Styling</h3>
        <p>You can customize the widget appearance by updating the configuration:</p>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`KogentsChatWidget.updateConfig({
  color: '#FF5733',
  buttonText: 'Chat with us',
  headerTitle: 'Customer Support'
});`}
        </pre>

        <h3 id="pre-populating-user-information">Pre-populating User Information</h3>
        <p>You can pre-populate user information when your page loads:</p>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`// Wait for widget to be ready
KogentsChatWidget.on('ready', () => {
  // Identify the user
  KogentsChatWidget.identify({
    name: 'John Doe',
    email: 'john@example.com',
    id: '123456',
    // Add any custom attributes
    custom: {
      plan: 'Premium',
      signupDate: '2023-01-15'
    }
  });
});`}
        </pre>

        <h2 id="troubleshooting">Troubleshooting</h2>
        <p>If you encounter issues with the widget:</p>
        <ol>
          <li>Check the browser console for errors</li>
          <li>Verify that the script is loading correctly</li>
          <li>Ensure the widget ID is set correctly</li>
          <li>Try clearing your browser cache</li>
        </ol>
      </div>
    </div>
  )
}
