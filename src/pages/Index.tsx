import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Search,
  RefreshCw,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  BookPlus,
  X,
} from 'lucide-react';
import { Header } from '@/components/library/Header';
import { BookCard } from '@/components/library/BookCard';
import { ReaderForm } from '@/components/library/ReaderForm';
import { AddBookForm } from '@/components/library/AddBookForm';
import { BorrowModal } from '@/components/library/BorrowModal';
import { StatsCard } from '@/components/library/StatsCard';
import { useLibrary } from '@/hooks/useLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Book, Reader } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'register'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    field: 'title' | 'author' | 'publication_year';
    direction: 'asc' | 'desc';
  }>({ field: 'title', direction: 'asc' });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);

  const {
    books,
    readers,
    loading,
    stats,
    fetchData,
    handleRegisterReader,
    handleAddBook,
    handleDeleteBook,
    handleBorrow,
    handleReturn,
  } = useLibrary();

  const processedBooks = useMemo(() => {
    let result = books.filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.borrower_phone && b.borrower_phone.includes(searchQuery))
    );

    return result.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [books, searchQuery, sortConfig]);

  const handleConfirmDelete = (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту книгу? Это действие необратимо.')) {
      handleDeleteBook(id);
    }
  };

  const handleConfirmReturn = (id: number) => {
    if (confirm('Подтвердить возврат книги в библиотеку?')) {
      handleReturn(id);
    }
  };

  const handleBookSubmit = async (data: any) => {
    const success = await handleAddBook(data);
    if (success) {
      setIsAddBookModalOpen(false);
    }
    return success;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="Всего книг"
            value={stats.total}
            icon={BookOpen}
            color="primary"
            delay={0}
          />
          <StatsCard
            title="Выдано"
            value={stats.borrowed}
            icon={RefreshCw}
            color="warning"
            delay={0.1}
          />
          <StatsCard
            title="Читателей"
            value={stats.readers}
            icon={Users}
            color="success"
            delay={0.2}
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Search and Sort Bar */}
              <div className="flex flex-col xl:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Поиск по названию, автору или телефону читателя..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Select
                    value={sortConfig.field}
                    onValueChange={(value: any) =>
                      setSortConfig((prev) => ({ ...prev, field: value }))
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">По названию</SelectItem>
                      <SelectItem value="author">По автору</SelectItem>
                      <SelectItem value="publication_year">По году</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSortConfig((prev) => ({
                        ...prev,
                        direction: prev.direction === 'asc' ? 'desc' : 'asc',
                      }))
                    }
                  >
                    {sortConfig.direction === 'asc' ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>

                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>

                  <Button onClick={() => setIsAddBookModalOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Добавить книгу
                  </Button>
                </div>
              </div>

              {/* Grid */}
              {processedBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedBooks.map((book, index) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onBorrow={() => setSelectedBook(book)}
                      onReturn={() => handleConfirmReturn(book.id)}
                      onDelete={() => handleConfirmDelete(book.id)}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-card rounded-xl border border-dashed border-border"
                >
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">Книги не найдены</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Попробуйте изменить поисковый запрос.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <PlusCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display">Регистрация читателя</CardTitle>
                      <CardDescription>
                        Добавьте нового пользователя в базу данных библиотеки
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-muted/30">
                  <ReaderForm onSubmit={handleRegisterReader} isLoading={loading} />
                </CardContent>

                {/* Recent Readers List */}
                <div className="px-6 py-6 border-t border-border/50 bg-card">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                    Последние регистрации
                  </h3>
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-border/50">
                      {readers.slice(0, 5).map((reader) => (
                        <li key={reader.phone} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {reader.first_name[0]}
                                {reader.last_name[0]}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {reader.last_name} {reader.first_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                ID: {reader.phone} • Рег: {reader.registration_date}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Borrow Modal */}
      {selectedBook && (
        <BorrowModal
          book={selectedBook}
          readers={readers}
          onClose={() => setSelectedBook(null)}
          onConfirm={(phone) => {
            handleBorrow(selectedBook.id, phone);
            setSelectedBook(null);
          }}
          loading={loading}
        />
      )}

      {/* Add Book Modal */}
      <Dialog open={isAddBookModalOpen} onOpenChange={setIsAddBookModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BookPlus className="h-6 w-6 text-accent" />
              </div>
              <DialogTitle className="font-display">Новая книга</DialogTitle>
            </div>
          </DialogHeader>
          <div className="bg-muted/30 p-6 -mx-6 -mb-6 rounded-b-lg">
            <AddBookForm
              onSubmit={handleBookSubmit}
              onCancel={() => setIsAddBookModalOpen(false)}
              isLoading={loading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
