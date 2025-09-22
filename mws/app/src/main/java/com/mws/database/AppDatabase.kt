package com.mws.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.mws.database.converter.DateConverter
import com.mws.database.dao.TestSessionDao
import com.mws.database.dao.AppStateLogDao
import com.mws.database.dao.FailedSubmissionDao
import com.mws.database.entity.TestSession
import com.mws.database.entity.AppStateLog
import com.mws.database.entity.FailedSubmission

@Database(
    entities = [
        TestSession::class,
        AppStateLog::class,
        FailedSubmission::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(DateConverter::class)
abstract class AppDatabase : RoomDatabase() {
    
    abstract fun testSessionDao(): TestSessionDao
    abstract fun appStateLogDao(): AppStateLogDao
    abstract fun failedSubmissionDao(): FailedSubmissionDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "mws_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
