import { motion } from 'framer-motion';
import { Book, BookStatus } from '@/types';
import { Calendar, User, Clock, CheckCircle, ArrowRightCircle, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface BookCardProps {
  book: Book;
  onBorrow: () => void;
  onReturn: () => void;
  onDelete: () => void;
}

export const BookCard = ({ book, onBorrow, onReturn, onDelete }: BookCardProps) => {
  const isBorrowed = book.status === BookStatus.BORROWED;

  const getDaysHeld = (dateString?: string | null) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysHeld = isBorrowed ? getDaysHeld(book.borrowed_date) : 0;
  const isOverdue = daysHeld > 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="h-full flex flex-col overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 bg-card">
        <CardContent className="p-5 flex-grow">
          <div className="flex justify-between items-start mb-3">
            <Badge variant="secondary" className="font-medium">
              {book.genre}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant={isBorrowed ? "destructive" : "default"} className={isBorrowed ? "" : "bg-success text-success-foreground"}>
                {isBorrowed ? 'На руках' : 'В наличии'}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-foreground leading-tight mb-1 line-clamp-2">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground mb-4 border-t border-border/50 pt-3">
            <div><span className="font-semibold text-foreground/70">Год:</span> {book.publication_year}</div>
            <div><span className="font-semibold text-foreground/70">Стр:</span> {book.page_count}</div>
            <div><span className="font-semibold text-foreground/70">Обложка:</span> {book.cover_type}</div>
            <div><span className="font-semibold text-foreground/70">Сост:</span> {book.condition_state}</div>
          </div>

          {isBorrowed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mt-3 p-3 rounded-lg text-sm ${isOverdue ? 'bg-danger/10 border border-danger/20' : 'bg-primary/10 border border-primary/20'}`}
            >
              <div className="flex items-center text-foreground font-medium mb-1">
                <User className="w-3.5 h-3.5 mr-1.5" />
                {book.last_name} {book.first_name ? `${book.first_name[0]}.` : ''}
              </div>
              <div className="text-muted-foreground text-xs mb-2">ID: {book.borrower_phone}</div>
              <div className={`flex items-center text-xs font-semibold ${isOverdue ? 'text-danger' : 'text-primary'}`}>
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {daysHeld} дн. у читателя {isOverdue && '(просрочено!)'}
              </div>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/30 px-5 py-3 border-t border-border/50">
          {isBorrowed ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={onReturn}
            >
              <CheckCircle className="w-4 h-4 mr-2 text-success" />
              Принять возврат
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={onBorrow}
            >
              <ArrowRightCircle className="w-4 h-4 mr-2" />
              Выдать книгу
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};
