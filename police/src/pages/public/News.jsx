import React from 'react';
import { Calendar, Tag } from 'lucide-react';

const mockNews = [
    {
        id: 1,
        title: "Chief Announces New Community Policing Initiative",
        date: "Feb 01, 2024",
        category: "Press Release",
        excerpt: "The Metro City Police Department is launching 'Project Neighbor', a new program designed to increase officer engagement in residential areas through foot patrols and town halls.",
        image: "https://placehold.co/800x400/0f172a/ffffff?text=Community+Policing"
    },
    {
        id: 2,
        title: "Road Clousures for Annual Marathon",
        date: "Jan 28, 2024",
        category: "Traffic Alert",
        excerpt: "Please be advised of multiple road closures downtown this Sunday for the 10th Annual Metro Marathon. See full map for detour routes.",
        image: "https://placehold.co/800x400/b91c1c/ffffff?text=Traffic+Alert"
    },
    {
        id: 3,
        title: "Q4 Crime Statistics Released",
        date: "Jan 15, 2024",
        category: "Transparency",
        excerpt: "Overall property crime is down 12% compared to last year. Read the full detailed breakdown in our quarterly transparency report.",
        image: "https://placehold.co/800x400/0ea5e9/ffffff?text=Stats+Report"
    }
];

const News = () => {
    return (
        <div className="news-page">
            <div className="page-header">
                <div className="container">
                    <h1>News & Alerts</h1>
                    <p>Official updates from the Metro City Police Department</p>
                </div>
            </div>

            <div className="container content-grid">
                <div className="news-feed">
                    {mockNews.map(item => (
                        <article className="news-card" key={item.id}>
                            <div className="card-img" style={{ backgroundImage: `url(${item.image})` }}></div>
                            <div className="card-content">
                                <div className="meta">
                                    <span className="meta-item"><Calendar size={14} /> {item.date}</span>
                                    <span className="meta-item tag"><Tag size={14} /> {item.category}</span>
                                </div>
                                <h2>{item.title}</h2>
                                <p>{item.excerpt}</p>
                                <button className="read-more">Read Full Story &rarr;</button>
                            </div>
                        </article>
                    ))}
                </div>

                <aside className="sidebar">
                    <div className="widget">
                        <h3>Media Inquiries</h3>
                        <p className="contact-info">
                            <strong>PIO Sgt. Sarah Jenkins</strong><br />
                            media@metropolice.gov<br />
                            (555) 012-9900
                        </p>
                    </div>
                    <div className="widget">
                        <h3>Filter by Category</h3>
                        <ul className="cat-list">
                            <li>All News</li>
                            <li>Press Releases</li>
                            <li>Traffic Alerts</li>
                            <li>Wanted / Missing</li>
                            <li>Community Events</li>
                        </ul>
                    </div>
                </aside>
            </div>

            <style>{`
        .page-header { background: #f8fafc; padding: 4rem 0; text-align: center; border-bottom: 1px solid #e2e8f0; margin-bottom: 3rem; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--primary-blue); }
        .page-header p { color: #64748b; font-size: 1.1rem; }

        .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 3rem; padding-bottom: 4rem; }
        
        .news-feed { display: flex; flex-direction: column; gap: 2rem; }
        .news-card { display: flex; background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; height: 240px; }
        .card-img { width: 35%; background-size: cover; background-position: center; }
        .card-content { flex: 1; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; }
        
        .meta { display: flex; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.85rem; color: #94a3b8; }
        .meta-item { display: flex; align-items: center; gap: 0.4rem; }
        .tag { color: var(--accent-blue); font-weight: 500; }
        
        .card-content h2 { margin-bottom: 0.75rem; font-size: 1.25rem; }
        .card-content p { color: #64748b; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem; flex: 1; overflow: hidden; }
        .read-more { background: none; color: var(--accent-blue); font-weight: 600; padding: 0; font-size: 0.9rem; margin-top: auto; }

        .widget { background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 2rem; }
        .widget h3 { font-size: 1.1rem; margin-bottom: 1rem; color: var(--primary-blue); border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
        .contact-info { font-size: 0.95rem; line-height: 1.6; color: #334155; }
        .cat-list { list-style: none; }
        .cat-list li { padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0; color: #64748b; cursor: pointer; transition: color 0.2s; }
        .cat-list li:hover { color: var(--accent-blue); }

        @media (max-width: 768px) {
          .content-grid { grid-template-columns: 1fr; }
          .news-card { flex-direction: column; height: auto; }
          .card-img { width: 100%; height: 200px; }
        }
      `}</style>
        </div>
    );
};

export default News;
