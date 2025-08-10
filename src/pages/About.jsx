import '../styles/About.css';
import Banner from '../components/Banner';

export default function About() {
    return (
        <>
            <Banner />
            <div className="container">
                <h1>About me</h1>
                <iframe id="pdf-iframe" src="/SethPietrowskiCurriculumVitaeV9.pdf"></iframe>
            </div>
            <footer>
                Thank you for your time<span style="font-size: 85px;">.</span>
            </footer>
        </>
    );
}