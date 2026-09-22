import Card from "@/components/Card";
import styles from "./discovery.module.css";

export default function Discovery() {
  const quickSearches = ["HTML", "Python", "Java", "JavaScript", "Database", "Networking", "UI Design", "React"];

  const features = [
    {
      title: "AI-Powered Recommendations",
      desc: "Get personalized career suggestions based on your current skills",
      icon: "◎",
      color: styles.iconPurple,
    },
    {
      title: "Next Steps Guide",
      desc: "Discover what skills to learn next to advance your career",
      icon: "💡",
      color: styles.iconBlue,
    },
    {
      title: "Market Insights",
      desc: "See salary ranges and job demand for different tech roles",
      icon: "📈",
      color: styles.iconGreen,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Discover Your <span className={styles.highlight}>Perfect Career</span>
        </h1>
        <p className={styles.subtitle}>
          Enter a skill, subject, or programming language you know, and we&apos;ll show you the perfect career paths
        </p>
      </div>

      <Card className={styles.searchCard}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input 
            type="text" 
            placeholder="e.g., HTML, Python, JavaScript, Database, UI Design..." 
            className={styles.searchInput}
          />
          <button className={styles.discoverBtn}>
            ✨ Discover
          </button>
        </div>
        
        <div className={styles.quickSearchContainer}>
          <p className={styles.quickSearchLabel}>Quick search:</p>
          <div className={styles.quickSearchTags}>
            {quickSearches.map((tag, i) => (
              <button key={i} className={styles.quickTag}>{tag}</button>
            ))}
          </div>
        </div>
      </Card>

      <div className={styles.featuresGrid}>
        {features.map((feature, i) => (
          <Card key={i} className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${feature.color}`}>
              {feature.icon}
            </div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDesc}>{feature.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}