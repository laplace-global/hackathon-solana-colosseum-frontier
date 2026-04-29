import { Card, CardContent } from '@/components/ui/card';
import { Calendar, TrendingUp, Building2, Award } from 'lucide-react';

const newsItems = [
  {
    id: 1,
    title: 'THE SAIL Reaches 42% Sales Milestone',
    excerpt: 'Strong investor interest drives rapid sales growth in our flagship Melaka property.',
    date: '2024-12-15',
    category: 'Sales Update',
    icon: TrendingUp,
  },
  {
    id: 2,
    title: 'NYRA Hotel Receives Green Building Certification',
    excerpt: 'Our commitment to sustainability recognized with prestigious environmental award.',
    date: '2024-12-10',
    category: 'Achievement',
    icon: Award,
  },
  {
    id: 3,
    title: 'M-WEZ Development Progress Update',
    excerpt: 'Government announces new infrastructure investments in Melaka Waterfront Zone.',
    date: '2024-12-05',
    category: 'Infrastructure',
    icon: Building2,
  }
];

export function NewsSection() {
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-eyebrow text-primary mb-4">Latest Updates</p>
          <h2 className="font-serif text-4xl font-light text-foreground md:text-5xl">
            Investment News &amp; Updates
          </h2>
          <p className="mt-6 text-bodyeditorial text-muted-foreground">
            Stay informed about our latest developments and market insights
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {newsItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="group cursor-pointer rounded-none border-border bg-card transition-colors hover:bg-card">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-eyebrow text-muted-foreground">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="mb-3 font-serif text-xl font-light text-foreground group-hover:text-primary">
                    {item.title}
                  </h3>

                  <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                    {item.excerpt}
                  </p>

                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a href="/news" className="text-uibtn text-primary hover:underline">
            View All News →
          </a>
        </div>
      </div>
    </section>
  );
}
