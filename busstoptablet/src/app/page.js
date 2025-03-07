import Head from "next/head";
import BusSearch from "./component/busStopService";
import 'bootstrap/dist/css/bootstrap.min.css';  // ✅ Import Bootstrap CS

export default function Home() {
    return (
        <div>
            <Head>
                <title>Bus Stop Tablet</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
            </Head>

            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand" href="#">When Come?</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <a className="nav-link" href="#">Bus Stop Near Me</a>
                        </li>
                    </ul>
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <a className="nav-link" href="#">Login</a>
                        </li>
                    </ul>
                </div>
            </nav>

            <h1 className="text-center mt-4">Bus Timing</h1>
            
            <BusSearch />
        </div>
    );
}